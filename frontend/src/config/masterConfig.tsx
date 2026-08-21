export type MasterType =
  | 'state'
  | 'district'
  | 'mandal'
  | 'village'
  | 'school'
  | 'course'
  | 'class'
  | 'subject'
  | 'courseSubject'
  | 'academicYear'
  | 'caste'
  | 'relationship';

export type MasterGroup = 'Location' | 'Education' | 'General';

export interface MasterColumn {
  key: string;
  label: string;
  width?: string;
}

export type MasterField =
  | { key: string; label: string; required?: boolean; type: { kind: 'text' } }
  | { key: string; label: string; required?: boolean; type: { kind: 'number' } }
  | { key: string; label: string; required?: boolean; type: { kind: 'date' } }
  | { key: string; label: string; required?: boolean; type: { kind: 'textarea' } }
  | { key: string; label: string; required?: boolean; type: { kind: 'checkbox' } }
  | { key: string; label: string; required?: boolean; resolvedKey?: string; type: { kind: 'select'; source: MasterSelectSource } };

export type MasterSelectSource =
  | { kind: 'master'; type: MasterType }
  | { kind: 'classByCourse'; courseField: string }
  | { kind: 'locationCascade' };

export interface MasterConfig {
  type: MasterType;
  label: string;
  singular: string;
  group: MasterGroup;
  columns: MasterColumn[];
  fields: MasterField[];
  searchPlaceholder: string;
}

const idColumn: MasterColumn = { key: 'id', label: 'S.No', width: '70px' };
const actionColumn: MasterColumn = { key: '_actions', label: '', width: '120px' };

export const masterConfigs: MasterConfig[] = [
  {
    type: 'state',
    label: 'States',
    singular: 'State',
    group: 'Location',
    columns: [idColumn, { key: 'name', label: 'State Name' }],
    fields: [{ key: 'name', label: 'State Name *', required: true, type: { kind: 'text' } }],
    searchPlaceholder: 'Search states...',
  },
  {
    type: 'district',
    label: 'Districts',
    singular: 'District',
    group: 'Location',
    columns: [idColumn, { key: 'name', label: 'District Name' }, { key: 'stateName', label: 'State' }],
    fields: [
      { key: 'stateId', label: 'State *', required: true, resolvedKey: 'stateName', type: { kind: 'select', source: { kind: 'master', type: 'state' } } },
      { key: 'name', label: 'District Name *', required: true, type: { kind: 'text' } },
    ],
    searchPlaceholder: 'Search districts...',
  },
  {
    type: 'mandal',
    label: 'Mandals',
    singular: 'Mandal',
    group: 'Location',
    columns: [idColumn, { key: 'name', label: 'Mandal Name' }, { key: 'districtName', label: 'District' }],
    fields: [
      { key: 'districtId', label: 'District *', required: true, resolvedKey: 'districtName', type: { kind: 'select', source: { kind: 'master', type: 'district' } } },
      { key: 'name', label: 'Mandal Name *', required: true, type: { kind: 'text' } },
    ],
    searchPlaceholder: 'Search mandals...',
  },
  {
    type: 'village',
    label: 'Villages',
    singular: 'Village',
    group: 'Location',
    columns: [idColumn, { key: 'name', label: 'Village Name' }, { key: 'pincode', label: 'Pincode' }, { key: 'mandalName', label: 'Mandal' }],
    fields: [
      { key: 'mandalId', label: 'Mandal *', required: true, resolvedKey: 'mandalName', type: { kind: 'select', source: { kind: 'master', type: 'mandal' } } },
      { key: 'name', label: 'Village Name *', required: true, type: { kind: 'text' } },
      { key: 'pincode', label: 'Pincode *', required: true, type: { kind: 'number' } },
    ],
    searchPlaceholder: 'Search villages...',
  },
  {
    type: 'school',
    label: 'Schools',
    singular: 'School',
    group: 'Location',
    columns: [idColumn, { key: 'name', label: 'School Name' }, { key: 'villageName', label: 'Village' }, { key: 'mandalName', label: 'Mandal' }, { key: 'districtName', label: 'District' }],
    fields: [
      { key: 'villageId', label: 'Location *', required: true, resolvedKey: 'villageName', type: { kind: 'select', source: { kind: 'locationCascade' } } },
      { key: 'name', label: 'School Name *', required: true, type: { kind: 'text' } },
      { key: 'address', label: 'Address *', required: true, type: { kind: 'textarea' } },
    ],
    searchPlaceholder: 'Search schools...',
  },
  {
    type: 'course',
    label: 'Courses',
    singular: 'Course',
    group: 'Education',
    columns: [idColumn, { key: 'name', label: 'Course Name' }, { key: 'boardType', label: 'Board Type' }],
    fields: [
      { key: 'name', label: 'Course Name *', required: true, type: { kind: 'text' } },
      { key: 'boardType', label: 'Board Type *', required: true, type: { kind: 'text' } },
    ],
    searchPlaceholder: 'Search courses...',
  },
  {
    type: 'class',
    label: 'Classes',
    singular: 'Class',
    group: 'Education',
    columns: [idColumn, { key: 'name', label: 'Class Name' }, { key: 'courseName', label: 'Course' }, { key: 'classOrder', label: 'Order' }],
    fields: [
      { key: 'courseId', label: 'Course *', required: true, resolvedKey: 'courseName', type: { kind: 'select', source: { kind: 'master', type: 'course' } } },
      { key: 'name', label: 'Class Name *', required: true, type: { kind: 'text' } },
      { key: 'classOrder', label: 'Class Order', type: { kind: 'number' } },
    ],
    searchPlaceholder: 'Search classes...',
  },
  {
    type: 'subject',
    label: 'Subjects',
    singular: 'Subject',
    group: 'Education',
    columns: [idColumn, { key: 'name', label: 'Subject Name' }],
    fields: [{ key: 'name', label: 'Subject Name *', required: true, type: { kind: 'text' } }],
    searchPlaceholder: 'Search subjects...',
  },
  {
    type: 'courseSubject',
    label: 'Course Subjects',
    singular: 'Course Subject',
    group: 'Education',
    columns: [idColumn, { key: 'courseName', label: 'Course' }, { key: 'className', label: 'Class' }, { key: 'subjectName', label: 'Subject' }, { key: 'subjectCode', label: 'Subject Code' }],
    fields: [
      { key: 'courseId', label: 'Course *', required: true, type: { kind: 'select', source: { kind: 'master', type: 'course' } } },
      { key: 'classId', label: 'Class *', required: true, resolvedKey: 'className', type: { kind: 'select', source: { kind: 'classByCourse', courseField: 'courseId' } } },
      { key: 'subjectId', label: 'Subject *', required: true, resolvedKey: 'subjectName', type: { kind: 'select', source: { kind: 'master', type: 'subject' } } },
      { key: 'subjectCode', label: 'Subject Code', type: { kind: 'text' } },
    ],
    searchPlaceholder: 'Search by course, class, subject or code...',
  },
  {
    type: 'academicYear',
    label: 'Academic Years',
    singular: 'Academic Year',
    group: 'Education',
    columns: [idColumn, { key: 'name', label: 'Academic Year' }, { key: 'startDate', label: 'Start' }, { key: 'endDate', label: 'End' }, { key: 'isCurrent', label: 'Current' }, { key: 'isActive', label: 'Active' }],
    fields: [
      { key: 'name', label: 'Academic Year *', required: true, type: { kind: 'text' } },
      { key: 'startDate', label: 'Start Date *', required: true, type: { kind: 'date' } },
      { key: 'endDate', label: 'End Date *', required: true, type: { kind: 'date' } },
      { key: 'isCurrent', label: 'Current Year', type: { kind: 'checkbox' } },
      { key: 'isActive', label: 'Active', type: { kind: 'checkbox' } },
    ],
    searchPlaceholder: 'Search academic years...',
  },
  {
    type: 'caste',
    label: 'Castes',
    singular: 'Caste',
    group: 'General',
    columns: [idColumn, { key: 'name', label: 'Caste Name' }],
    fields: [{ key: 'name', label: 'Caste Name *', required: true, type: { kind: 'text' } }],
    searchPlaceholder: 'Search castes...',
  },
  {
    type: 'relationship',
    label: 'Relationships',
    singular: 'Relationship',
    group: 'General',
    columns: [idColumn, { key: 'name', label: 'Relationship Name' }, { key: 'description', label: 'Description' }],
    fields: [
      { key: 'name', label: 'Relationship Name *', required: true, type: { kind: 'text' } },
      { key: 'description', label: 'Description', type: { kind: 'textarea' } },
    ],
    searchPlaceholder: 'Search relationships...',
  },
];

export const masterConfigMap: Record<MasterType, MasterConfig> = Object.fromEntries(
  masterConfigs.map((c) => [c.type, c]),
) as Record<MasterType, MasterConfig>;

export const locationColumns: MasterColumn[] = [
  idColumn,
  { key: 'name', label: 'State' },
  { key: 'districtName', label: 'District' },
  { key: 'mandalName', label: 'Mandal' },
  { key: 'villageName', label: 'Village' },
];