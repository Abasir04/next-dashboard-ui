# Table Component Standards

This document outlines the standard pattern for implementing table components with search and refresh functionality.

## Required Components

### 1. TableSearchWithRefresh Component

All table components should use the `TableSearchWithRefresh` component which provides:

- **Search input** with search icon
- **Refresh button** with loading spinner
- **Consistent styling** across all tables

```tsx
import TableSearchWithRefresh from "@/components/TableSearchWithRefresh";
```

### 2. Required State Variables

Every table component must include these state variables:

```tsx
const [data, setData] = useState<DataType[]>([]);
const [loading, setLoading] = useState(true);
const [searchTerm, setSearchTerm] = useState("");
```

### 3. Required Functions

Every table component must implement these functions:

```tsx
// Fetch data function with useCallback
const fetchData = useCallback(async () => {
  try {
    setLoading(true);
    const response = await fetch("/api/endpoint");

    if (!response.ok) {
      throw new Error("Failed to fetch data");
    }

    const result = await response.json();
    setData(result.data || []);
  } catch (error) {
    console.error("Error fetching data:", error);
    toast.error("Failed to fetch data");
  } finally {
    setLoading(false);
  }
}, []);

// useEffect to call fetchData
useEffect(() => {
  fetchData();
}, [fetchData]);

// Refresh function
const handleRefresh = () => {
  fetchData();
};
```

### 4. Filtering Logic

Every table component must implement filtering:

```tsx
// Filter data based on search term
const filteredData = data.filter((item) =>
  item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  item.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  // Add other searchable fields as needed
);
```

### 5. UI Structure

Every table component must follow this UI structure:

```tsx
return (
  <div className="bg-white p-4 rounded-md flex-1 mt-0">
    {/* HEADER */}
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-xl font-semibold text-gray-800">
        Component Name ({filteredData.length})
      </h1>
      <div className="flex items-center gap-4">
        <TableSearchWithRefresh
          value={searchTerm}
          onChange={setSearchTerm}
          onRefresh={handleRefresh}
          placeholder="Search by relevant fields..."
          isLoading={loading}
        />
        {/* Action buttons */}
      </div>
    </div>

    {/* TABLE */}
    {filteredData.length === 0 ? (
      <div className="text-center py-12">
        {/* Empty state */}
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {/* Table headers */}
          </thead>
          <tbody>
            {filteredData.map((item) => (
              // Table rows
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);
```

## Search Implementation Guidelines

### Searchable Fields

Include these common fields in search filtering:

- **Name/Title**: Primary identifier
- **Code/ID**: Unique identifier
- **Description**: Additional context
- **Related entities**: Course names, student names, etc.

### Search Examples

**Students Table:**

```tsx
const filteredStudents = students.filter(
  (student) =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.matricNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.courses.some(
      (course) =>
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.code.toLowerCase().includes(searchTerm.toLowerCase())
    )
);
```

**Assignments Table:**

```tsx
const filteredAssignments = assignments.filter(
  (assignment) =>
    assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.description?.toLowerCase().includes(searchTerm.toLowerCase())
);
```

**Courses Table:**

```tsx
const filteredCourses = courses.filter(
  (course) =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code.toLowerCase().includes(searchTerm.toLowerCase())
);
```

## Component Props

### TableSearchWithRefresh Props

```tsx
interface TableSearchWithRefreshProps {
  value?: string; // Search input value
  onChange?: (value: string) => void; // Search input change handler
  onRefresh?: () => void; // Refresh button click handler
  placeholder?: string; // Search input placeholder
  isLoading?: boolean; // Loading state for refresh button
}
```

## Implementation Checklist

- [ ] Import `TableSearchWithRefresh` component
- [ ] Add `searchTerm` state variable
- [ ] Implement `fetchData` function with `useCallback`
- [ ] Add `useEffect` to call `fetchData`
- [ ] Implement `handleRefresh` function
- [ ] Add filtering logic for `filteredData`
- [ ] Update header to show filtered count
- [ ] Add `TableSearchWithRefresh` component to header
- [ ] Update table to use `filteredData` instead of `data`
- [ ] Update empty state to use `filteredData.length`

## Benefits

- **Consistent UX**: All tables behave the same way
- **Better Performance**: useCallback prevents unnecessary re-renders
- **Real-time Search**: Instant filtering as user types
- **Data Freshness**: Easy refresh functionality
- **Loading States**: Visual feedback during operations
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Future Components

When creating new table components, follow this pattern to ensure consistency across the application. This standard has been implemented in:

- ✅ **Courses Page** (`/menu/courses`)
- ✅ **Students Page** (`/menu/students`)
- ✅ **Assignments Page** (`/menu/assignments`)

All future table components should follow this same pattern.
