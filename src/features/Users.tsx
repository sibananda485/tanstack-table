import React from "react";
import {
  Column,
  ColumnFiltersState,
  FilterFn,
  RowData,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { data as userData } from "./data";
import { columns } from "./Column";
import {
  ArrowDownAZ,
  ArrowDownZA,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  EllipsisVertical,
  SlidersHorizontal,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Input } from "../components/ui/input";
import { RankingInfo, rankItem } from "@tanstack/match-sorter-utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { Checkbox } from "../components/ui/checkbox";
import * as XLSX from "xlsx";

declare module "@tanstack/react-table" {
  //allows us to define custom properties for our columns
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: "text" | "range" | "select";
  }
  interface FilterFns {
    fuzzy: FilterFn<unknown>;
  }
  interface FilterMeta {
    itemRank: RankingInfo;
  }
}

export default function Users() {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
    // Rank the item
    const itemRank = rankItem(row.getValue(columnId), value);

    // Store the itemRank info
    addMeta({
      itemRank,
    });

    // Return if the item should be filtered in/out
    return itemRank.passed;
  };

  const table = useReactTable({
    data: userData,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter, //define as a filter function that can be used in column definitions
    },
    state: {
      columnFilters,
      globalFilter,
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "fuzzy",
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(), //client side filtering
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    debugTable: true,
    debugHeaders: true,
    debugColumns: false,
  });

  const handleDownload = () => {
    const filteredRows = table.getFilteredRowModel().rows;

    // Get visible columns
    const visibleColumns = table
      .getAllColumns()
      .filter((col) => col.getIsVisible());

    // Extract the data exactly as displayed in the table
    const excelData = filteredRows.map((row) => {
      const rowData: Record<string, any> = {};

      row.getAllCells().forEach((cell) => {
        // Include only data for visible columns
        if (visibleColumns.some((col) => col.id === cell.column.id)) {
          const columnHeader = cell.column.columnDef.header?.toString() || "";
          rowData[columnHeader] = cell.getValue(); // Get the computed value from the cell
        }
      });

      return rowData;
    });

    // Create a worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Filtered Data");

    // Export to Excel file
    XLSX.writeFile(workbook, "filtered_data.xlsx");
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row justify-between">
          <div>
            <CardTitle>Create project</CardTitle>
            <CardDescription>
              Deploy your new project in one-click.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleDownload}
              variant="outline"
              size="sm"
              className="flex items-center text-xs"
            >
              <span className="hidden md:block">Excel</span> <Download />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center text-xs"
                >
                  <SlidersHorizontal className="w-2 h-2" />{" "}
                  <span className="hidden md:block">View</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-fit">
                <div className="space-y-1">
                  <label className="flex items-center gap-1">
                    <Checkbox
                      id="terms"
                      checked={table.getIsAllColumnsVisible()}
                      onCheckedChange={table.getToggleAllColumnsVisibilityHandler()}
                    />
                    Toggle All
                  </label>
                  {table.getAllLeafColumns().map((column) => {
                    return (
                      <label
                        key={column.id}
                        className="flex items-center gap-1"
                      >
                        <Checkbox
                          checked={column.getIsVisible()}
                          onCheckedChange={(isChecked) => {
                            column.toggleVisibility(isChecked === true);
                          }}
                        />

                        {column.columnDef.header?.toString()}
                      </label>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
            <DebouncedInput
              value={globalFilter ?? ""}
              onChange={(value) => setGlobalFilter(String(value))}
              className="max-w-xs ml-auto order-first md:order-last"
              placeholder="Search all columns..."
            />
          </div>
        </CardHeader>
        <CardContent className="overflow-auto">
          <table className="w-full overflow-auto">
            <thead className="bg-secondary">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <th
                        className="py-1 px-2 border-r"
                        key={header.id}
                        colSpan={header.colSpan}
                      >
                        {header.isPlaceholder ? null : (
                          <>
                            <div
                              {...{
                                className: header.column.getCanSort()
                                  ? "text-start text-nowrap cursor-pointer select-none flex items-center justify-between"
                                  : "text-start",
                                onClick:
                                  header.column.getToggleSortingHandler(),
                              }}
                            >
                              <div className="flex items-center">
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                                {{
                                  asc: <ArrowDownAZ className="w-4 h-4 ml-2" />,
                                  desc: (
                                    <ArrowDownZA className="w-4 h-4 ml-2" />
                                  ),
                                }[header.column.getIsSorted() as string] ??
                                  null}
                              </div>
                              {header.column.getCanFilter() ? (
                                <div onClick={(e) => e.stopPropagation()}>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <EllipsisVertical className="w-3 h-3" />
                                    </PopoverTrigger>
                                    <PopoverContent className="p-0 w-fit">
                                      <div>
                                        <Filter column={header.column} />
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                </div>
                              ) : null}
                            </div>
                          </>
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => {
                return (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => {
                      return (
                        <td
                          className="py-1 px-2 border-b border-b-secondary"
                          key={cell.id}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
        <CardFooter className="flex gap-4 flex-col md:flex-row justify-between">
          <div className="flex w-full md:w-fit justify-between items-center ">
            <span className="flex items-center gap-1">
              <div>Page</div>
              <strong>
                {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </strong>
            </span>
            <span className="hidden md:inline">|</span>
            <span className="flex items-center gap-1">
              Go to page:
              <Input
                type="number"
                min="1"
                max={table.getPageCount()}
                defaultValue={table.getState().pagination.pageIndex + 1}
                onChange={(e) => {
                  const page = e.target.value ? Number(e.target.value) - 1 : 0;
                  table.setPageIndex(page);
                }}
                className="p-0 md:px-3 md:py-2 w-16"
              />
            </span>
          </div>
          <div className="flex w-full md:w-fit justify-between items-center gap-5">
            <Select
              onValueChange={(e) => {
                table.setPageSize(Number(e));
              }}
              value={table.getState().pagination.pageSize + ""}
            >
              <SelectTrigger className="w-fit">
                <SelectValue placeholder="Select a fruit" />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={pageSize + ""}>
                    Show {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="space-x-1">
              <Button
                size={"sm"}
                variant={"secondary"}
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronsLeft />
              </Button>
              <Button
                size={"sm"}
                variant={"secondary"}
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft />
              </Button>
              <Button
                size={"sm"}
                variant={"secondary"}
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight />
              </Button>
              <Button
                size={"sm"}
                variant={"secondary"}
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <ChevronsRight />
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </>
  );
}

function Filter({ column }: { column: Column<any, unknown> }) {
  const columnFilterValue = column.getFilterValue();
  const { filterVariant } = column.columnDef.meta ?? {};

  return filterVariant === "range" ? (
    <div>
      <div className="flex space-x-2">
        {/* See faceted column filters example for min max values functionality */}
        <DebouncedInput
          type="number"
          value={(columnFilterValue as [number, number])?.[0] ?? ""}
          onChange={(value) =>
            column.setFilterValue((old: [number, number]) => [value, old?.[1]])
          }
          placeholder={`Min`}
          className="w-24 border shadow rounded"
        />
        <DebouncedInput
          type="number"
          value={(columnFilterValue as [number, number])?.[1] ?? ""}
          onChange={(value) =>
            column.setFilterValue((old: [number, number]) => [old?.[0], value])
          }
          placeholder={`Max`}
          className="w-24 border shadow rounded"
        />
      </div>
      <div className="h-1" />
    </div>
  ) : filterVariant === "select" ? (
    <select
      onChange={(e) => column.setFilterValue(e.target.value)}
      value={columnFilterValue?.toString()}
    >
      {/* See faceted column filters example for dynamic select options */}
      <option value="">All</option>
      <option value="complicated">complicated</option>
      <option value="relationship">relationship</option>
      <option value="single">single</option>
    </select>
  ) : (
    <DebouncedInput
      className="w-36 border shadow rounded"
      onChange={(value) => column.setFilterValue(value)}
      placeholder={`Search...`}
      type="text"
      value={(columnFilterValue ?? "") as string}
    />
    // See faceted column filters example for datalist search suggestions
  );
}

// A typical debounced input react component
function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 100,
  ...props
}: {
  value: string | number;
  onChange: (value: string | number) => void;
  debounce?: number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">) {
  const [value, setValue] = React.useState(initialValue);

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [value]);

  return (
    <Input
      {...props}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}
