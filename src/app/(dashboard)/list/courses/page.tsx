import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { getCurrentUserRole, getCoursesData } from "@/lib/dataService";
import Image from "next/image";

type Course = {
  id: number;
  name: string;
  lecturers: string[];
};

const columns = [
  {
    header: "Course Name",
    accessor: "name",
  },
  {
    header: "Lecturers",
    accessor: "lecturers",
    className: "hidden md:table-cell",
  },
  {
    header: "Actions",
    accessor: "action",
  },
];

const CourseListPage = async () => {
  const role = await getCurrentUserRole();
  const coursesData = await getCoursesData();
  const renderRow = (item: Course) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">{item.name}</td>
      <td className="hidden md:table-cell">{item.lecturers.join(",")}</td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              <FormModal table="course" type="update" data={item} />
              <FormModal table="course" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div>
      <h1 className="hidden md:block text-lg font-semibold">All Courses</h1>
      <FormModal table="course" type="create" />
      <Table columns={columns} renderRow={renderRow} data={coursesData} />
    </div>
  );
};

export default CourseListPage;
