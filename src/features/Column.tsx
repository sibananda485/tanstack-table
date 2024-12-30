import { ColumnDef } from "@tanstack/react-table";
import { User } from "./data";

export const columns: ColumnDef<User>[] = [
  {
    header: "Id",
    accessorKey: "id",
    filterFn: "includesString",
  },
  {
    header: "Date",
    accessorKey: "date",
  },
  {
    header: "First Name",
    accessorKey: "firstName",
  },
  {
    header: "Last Name",
    accessorKey: "lastName",
  },
  {
    header: "Email",
    accessorKey: "email",
  },
  {
    header: "Gender",
    accessorKey: "gender",
  },
  {
    header: "IP Address",
    accessorKey: "ipAddress",
  },
];
