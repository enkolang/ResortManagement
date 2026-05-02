import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Wrench,
  Car,
  Package,
  BarChart3,
  Calendar as CalendarIcon,
  LogOut,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Menu,
  X,
  Waves,
  Clock,
  Search,
  UserCheck,
  ListTodo,
  UserPlus,
  Archive,
  RotateCcw,
  ChevronDown,
  Utensils,
  PartyPopper,
  Gamepad2,
  BedDouble,
  Settings,
  TrendingUp,
  SlidersHorizontal,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface Department {
  name: string;
  color: string;
}

interface StaffMember {
  id: number;
  name: string;
  dept: string;
  schedule: string;
  assignedDays: number[];
  absentDays: number[];
  scheduleStart?: string;
  scheduleEnd?: string;
  scheduleTimeIn?: string;
  scheduleTimeOut?: string;
  scheduleLogs?: ScheduleLog[];
  archived?: boolean;
}

interface ScheduleLog {
  id: number;
  startDate: string;
  endDate: string;
  timeIn: string;
  timeOut: string;
}

interface MaintenanceTask {
  id: number;
  area: string;
  task: string;
  status: 'Done' | 'Pending';
  priority: 'Low' | 'Medium' | 'High';
  recurrence: 'Once' | 'Daily' | 'Weekly' | 'Monthly';
  cost: number;
  requestedAt: string;
  doneAt?: string;
}

interface InventoryItem {
  id: number;
  loggedAt: string;
  item: string;
  unit: string;
  qty: number;
  minQty: number;
  price: number;
  archived?: boolean;
  archivedAt?: string;
}

interface RequisitionRecord {
  id: number;
  staffName: string;
  department: string;
  itemId: number;
  quantity: number;
  requestedAt: string;
}

interface ParkingEntry {
  id: number;
  plate: string;
  type: string;
  timeIn: string;
  timeOut?: string;
}

interface Meeting {
  id: number;
  title: string;
  date: string;
  time: string;
  attendees: number[];
  priority: 'Low' | 'Medium' | 'High';
  recurrence: 'Once' | 'Daily' | 'Weekly' | 'Monthly';
  status: 'Pending' | 'Done';
  minutes: string;
}

interface SalesGlobalConfig {
  globalDiscountPct: number;
  weekendSurchargePct: number;
  seniorPwdDiscountPct: number;
  labels: {
    restaurantAdult: string;
    restaurantChild: string;
    recreationAdult: string;
    recreationChild: string;
  };
}

interface RestaurantItem {
  id: number;
  name: string;
  adultRate: number;
  childRate: number;
}

interface RecreationItem {
  id: number;
  name: string;
  adultRate: number;
  childRate: number;
}

interface FunctionRoom {
  id: number;
  name: string;
  baseRate: number;
  perHeadRate: number;
}

interface HotelRoomType {
  id: number;
  name: string;
  sizeLabel: string;
  weekdayRate: number;
  weekendRate: number;
}

interface HotelAddon {
  id: number;
  name: string;
  charge: number;
}

interface SalesBookingRecord {
  id: number;
  module: 'restaurant' | 'recreation' | 'function' | 'hotel';
  label: string;
  date: string;
  gross: number;
  discount: number;
  net: number;
}

interface SalesDataState {
  config: SalesGlobalConfig;
  restaurantItems: RestaurantItem[];
  recreationItems: RecreationItem[];
  functionRooms: FunctionRoom[];
  hotelRooms: HotelRoomType[];
  hotelAddons: HotelAddon[];
  records: SalesBookingRecord[];
}

const SALES_STORAGE_KEY = 'waterworld-sales-data-v1';

const DEFAULT_SALES_DATA: SalesDataState = {
  config: {
    globalDiscountPct: 0,
    weekendSurchargePct: 12,
    seniorPwdDiscountPct: 20,
    labels: {
      restaurantAdult: 'Adult',
      restaurantChild: 'Child',
      recreationAdult: 'Adult',
      recreationChild: 'Child',
    },
  },
  restaurantItems: [
    { id: 1, name: 'Buffet Meal', adultRate: 599, childRate: 349 },
    { id: 2, name: 'Grilled Combo', adultRate: 420, childRate: 280 },
  ],
  recreationItems: [
    { id: 1, name: 'Wave Pool Pass', adultRate: 250, childRate: 180 },
    { id: 2, name: 'Zipline Ride', adultRate: 300, childRate: 220 },
  ],
  functionRooms: [
    { id: 1, name: 'Coral Hall', baseRate: 5000, perHeadRate: 180 },
    { id: 2, name: 'Sunset Pavilion', baseRate: 8500, perHeadRate: 250 },
  ],
  hotelRooms: [
    { id: 1, name: 'Standard', sizeLabel: '2 Pax', weekdayRate: 2400, weekendRate: 2800 },
    { id: 2, name: 'Family Suite', sizeLabel: '4 Pax', weekdayRate: 4200, weekendRate: 5000 },
  ],
  hotelAddons: [
    { id: 1, name: 'Extra Bed', charge: 700 },
    { id: 2, name: 'Airport Transfer', charge: 1200 },
  ],
  records: [],
};

const safeNumber = (value: string) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const isWeekendDate = (isoDate: string) => {
  if (!isoDate) return false;
  const dateObj = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(dateObj.getTime())) return false;
  const day = dateObj.getDay();
  return day === 0 || day === 6;
};

const formatCurrency = (value: number) => `PHP ${value.toLocaleString()}`;

const INITIAL_DEPARTMENTS: Department[] = [
  { name: 'Lifeguard', color: '#0ea5e9' },
  { name: 'Front Desk', color: '#22c55e' },
  { name: 'Maintenance', color: '#f59e0b' },
  { name: 'Kitchen', color: '#ef4444' },
  { name: 'Security', color: '#8b5cf6' },
  { name: 'Admin', color: '#64748b' },
];

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-slate-100 bg-white shadow-sm ${className}`}>{children}</div>
);

const Button = ({
  children,
  onClick,
  variant = 'primary',
  icon: Icon,
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  icon?: React.ComponentType<{ size?: number }>;
  className?: string;
}) => {
  const variants = {
    primary: 'bg-sky-600 text-white hover:bg-sky-700 shadow-md shadow-sky-100',
    secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
    danger: 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100',
    success: 'bg-green-600 text-white hover:bg-green-700',
    outline: 'border-2 border-sky-600 text-sky-600 hover:bg-sky-50',
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${variants[variant]} ${className}`}
      type="button"
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
};

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b p-6">
          <h3 className="text-xl font-black tracking-tight text-slate-800 uppercase">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
            type="button"
          >
            <X size={24} />
          </button>
        </div>
        <div className="overflow-y-auto p-8">{children}</div>
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [salesNavOpen, setSalesNavOpen] = useState(true);
  const [inventoryFocusPanel, setInventoryFocusPanel] = useState<'warehouse' | null>(null);
  const [maintenanceFocusSection, setMaintenanceFocusSection] = useState<'pending' | null>(null);

  const [departments, setDepartments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [staff, setStaff] = useState<StaffMember[]>([
    {
      id: 1,
      name: 'Juan Dela Cruz',
      dept: 'Lifeguard',
      schedule: '08:00 AM - 05:00 PM',
      assignedDays: [1, 5, 21, 22, 23],
      absentDays: [23],
      scheduleStart: '2026-03-25',
      scheduleEnd: '2026-04-01',
      scheduleTimeIn: '08:00',
      scheduleTimeOut: '17:00',
      scheduleLogs: [
        {
          id: 1001,
          startDate: '2026-03-25',
          endDate: '2026-04-01',
          timeIn: '08:00',
          timeOut: '17:00',
        },
      ],
    },
    {
      id: 2,
      name: 'Maria Santos',
      dept: 'Front Desk',
      schedule: '09:00 AM - 06:00 PM',
      assignedDays: [2, 12, 21, 22],
      absentDays: [],
      scheduleStart: '2026-03-15',
      scheduleEnd: '2026-03-29',
      scheduleTimeIn: '09:00',
      scheduleTimeOut: '18:00',
      scheduleLogs: [
        {
          id: 1002,
          startDate: '2026-03-15',
          endDate: '2026-03-29',
          timeIn: '09:00',
          timeOut: '18:00',
        },
      ],
    },
    {
      id: 3,
      name: 'Rico Blanco',
      dept: 'Maintenance',
      schedule: '07:00 AM - 04:00 PM',
      assignedDays: [3, 21, 24, 25],
      absentDays: [24],
      scheduleStart: '2026-03-21',
      scheduleEnd: '2026-03-25',
      scheduleTimeIn: '07:00',
      scheduleTimeOut: '16:00',
      scheduleLogs: [
        {
          id: 1003,
          startDate: '2026-03-21',
          endDate: '2026-03-25',
          timeIn: '07:00',
          timeOut: '16:00',
        },
      ],
    },
  ]);

  const [maintenance, setMaintenance] = useState<MaintenanceTask[]>([
    {
      id: 1,
      area: 'Wave Pool',
      task: 'Filter Cleaning',
      status: 'Done',
      priority: 'Medium',
      recurrence: 'Weekly',
      cost: 1500,
      requestedAt: '03/18/2026, 08:30 AM',
      doneAt: '03/19/2026, 03:10 PM',
    },
    {
      id: 2,
      area: 'Room 302',
      task: 'AC Repair',
      status: 'Pending',
      priority: 'High',
      recurrence: 'Once',
      cost: 4500,
      requestedAt: '03/21/2026, 10:15 AM',
    },
    {
      id: 3,
      area: 'Slide B',
      task: 'Safety Inspection',
      status: 'Pending',
      priority: 'Low',
      recurrence: 'Daily',
      cost: 0,
      requestedAt: '03/22/2026, 11:00 AM',
    },
  ]);

  const [inventory, setInventory] = useState<InventoryItem[]>([
    { id: 1, loggedAt: '03/20/2026, 09:30 AM', item: 'Chlorine Tablets', unit: 'Bucket', qty: 15, minQty: 5, price: 2500 },
    { id: 2, loggedAt: '03/20/2026, 09:45 AM', item: 'Life Vests (M)', unit: 'pcs', qty: 45, minQty: 10, price: 1200 },
  ]);
  const [requisitions, setRequisitions] = useState<RequisitionRecord[]>([]);

  const [parking, setParking] = useState<ParkingEntry[]>([
    { id: 10, plate: 'XYZ 789', type: 'Car', timeIn: '03/28/2026, 09:15 AM' },
  ]);
  const [parkingHistory, setParkingHistory] = useState<ParkingEntry[]>([
    { id: 99, plate: 'ABC 123', type: 'Car', timeIn: '03/28/2026, 08:00 AM', timeOut: '03/28/2026, 10:00 AM' },
  ]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  const [salesData, setSalesData] = useState<SalesDataState>(() => {
    const raw = localStorage.getItem(SALES_STORAGE_KEY);
    if (!raw) return DEFAULT_SALES_DATA;
    try {
      const parsed = JSON.parse(raw) as Partial<SalesDataState>;
      return {
        ...DEFAULT_SALES_DATA,
        ...parsed,
        config: {
          ...DEFAULT_SALES_DATA.config,
          ...(parsed.config || {}),
          labels: {
            ...DEFAULT_SALES_DATA.config.labels,
            ...(parsed.config?.labels || {}),
          },
        },
      };
    } catch {
      return DEFAULT_SALES_DATA;
    }
  });

  useEffect(() => {
    localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(salesData));
  }, [salesData]);

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'staff', label: 'Staff & Scheduling', icon: Users },
    { id: 'meetings', label: 'Meetings', icon: CalendarIcon },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'parking', label: 'Parking', icon: Car },
  ];

  const salesSubItems = [
    { id: 'sales-dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'sales-restaurant', label: 'Restaurant', icon: Utensils },
    { id: 'sales-function', label: 'Function', icon: PartyPopper },
    { id: 'sales-recreation', label: 'Recreation', icon: Gamepad2 },
    { id: 'sales-hotel', label: 'Hotel Room', icon: BedDouble },
    { id: 'sales-settings', label: 'Settings', icon: Settings },
  ];

  const tabLabelMap: Record<string, string> = Object.fromEntries([
    ...menuItems.map((item) => [item.id, item.label] as const),
    ...salesSubItems.map((item) => [item.id, `Sales: ${item.label}`] as const),
  ]);

  return (
    <div className="flex min-h-screen bg-slate-50/50 font-sans text-slate-900">
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-20'} fixed z-40 flex h-full flex-col border-r border-slate-200 bg-white transition-all duration-300`}
      >
        <div className="flex items-center gap-3 p-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500 text-white shadow-lg shadow-sky-200">
            <Waves size={24} />
          </div>
          {sidebarOpen && <span className="text-xl font-extrabold tracking-tighter text-sky-950 uppercase">Water World</span>}
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full rounded-xl px-4 py-3 transition-all flex items-center gap-3 ${
                activeTab === item.id ? 'bg-sky-50 font-bold text-sky-700' : 'text-slate-500 hover:bg-slate-50'
              }`}
              type="button"
            >
              <item.icon size={20} />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}

          <div className="mt-3 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setSalesNavOpen((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-slate-600 transition-all hover:bg-slate-50"
            >
              <span className="text-xs font-black tracking-wide uppercase">Sales with Data Analytics</span>
              <ChevronDown size={16} className={`transition-transform ${salesNavOpen ? 'rotate-180' : ''}`} />
            </button>
            {salesNavOpen && (
              <div className="mt-1 space-y-1 pl-2">
                {salesSubItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all ${
                      activeTab === item.id ? 'bg-sky-50 font-bold text-sky-700' : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <item.icon size={16} />
                    {sidebarOpen && <span>{item.label}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>
        {/*<div className="border-t border-slate-100 p-4">
          <button
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-bold text-red-500 transition-all hover:bg-red-50"
            type="button"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>*/}
      </aside>

      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-100 bg-white/80 px-8 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              type="button"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-xl font-black tracking-tight text-slate-800 capitalize">
              {tabLabelMap[activeTab] || activeTab.replace('-', ' ')}
            </h2>
          </div>
          {/* <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 md:flex">
              <Search size={16} className="text-slate-400" />
              <input placeholder="Search anything..." className="w-48 border-none bg-transparent text-sm font-medium outline-none" />
            </div>
            <div className="flex items-center gap-3 border-l pl-4">
              <div className="text-right">
                <p className="text-xs leading-none font-black text-slate-800">Admin User</p>
                <p className="text-[10px] font-bold text-slate-400">Super Admin</p>
              </div>
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                className="h-10 w-10 rounded-xl border border-slate-200 bg-slate-100"
                alt="avatar"
              />
            </div>
          </div> */}

        </header>

        <div className="p-8">
          {activeTab === 'overview' && (
            <Overview
              staff={staff}
              setStaff={setStaff}
              departments={departments}
              meetings={meetings}
              inventory={inventory}
              maintenance={maintenance}
              salesData={salesData}
              onOpenMeetings={() => setActiveTab('meetings')}
              onOpenSalesDashboard={() => {
                setSalesNavOpen(true);
                setActiveTab('sales-dashboard');
              }}
              onOpenInventoryWarehouse={() => {
                setInventoryFocusPanel('warehouse');
                setActiveTab('inventory');
              }}
              onOpenMaintenancePending={() => {
                setMaintenanceFocusSection('pending');
                setActiveTab('maintenance');
              }}
            />
          )}
          {activeTab === 'staff' && (
            <StaffModule
              staff={staff}
              setStaff={setStaff}
              departments={departments}
              setDepartments={setDepartments}
            />
          )}
          {activeTab === 'maintenance' && (
            <MaintenanceModule
              maintenance={maintenance}
              setMaintenance={setMaintenance}
              focusSection={maintenanceFocusSection}
              onFocusConsumed={() => setMaintenanceFocusSection(null)}
            />
          )}
          {activeTab === 'inventory' && (
            <InventoryModule
              inventory={inventory}
              setInventory={setInventory}
              requisitions={requisitions}
              setRequisitions={setRequisitions}
              staff={staff}
              departments={departments}
              focusPanel={inventoryFocusPanel}
              onFocusConsumed={() => setInventoryFocusPanel(null)}
            />
          )}
          {activeTab === 'parking' && (
            <ParkingModule
              parking={parking}
              setParking={setParking}
              history={parkingHistory}
              setHistory={setParkingHistory}
            />
          )}
          {activeTab === 'meetings' && <MeetingsModule meetings={meetings} setMeetings={setMeetings} staff={staff} />}
          {activeTab.startsWith('sales-') && (
            <SalesAnalyticsModule activeTab={activeTab} salesData={salesData} setSalesData={setSalesData} />
          )}
        </div>
      </main>
    </div>
  );
}

function StaffModule({
  staff,
  setStaff,
  departments,
  setDepartments,
}: {
  staff: StaffMember[];
  setStaff: React.Dispatch<React.SetStateAction<StaffMember[]>>;
  departments: Department[];
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
}) {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedDay, setSelectedDay] = useState(today.getDate());

  const [isScheduling, setIsScheduling] = useState(false);
  const [isAddingPersonnel, setIsAddingPersonnel] = useState(false);
  const [isMonthlyScheduleOpen, setIsMonthlyScheduleOpen] = useState(false);
  const [monthlyScheduleDate, setMonthlyScheduleDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [editingLogId, setEditingLogId] = useState<number | null>(null);

  const [scheduleForm, setScheduleForm] = useState({
    targetType: 'person',
    id: '1',
    startDate: '',
    endDate: '',
    startTime: '08:00',
    endTime: '17:00',
  });
  const [personForm, setPersonForm] = useState({
    name: '',
    dept: 'Lifeguard',
    isNewDept: false,
    newDeptName: '',
    newDeptColor: '#3b82f6',
  });

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  const currentYear = today.getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  const monthlyYearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  useEffect(() => {
    if (selectedDay > daysInMonth) {
      setSelectedDay(daysInMonth);
    }
  }, [daysInMonth, selectedDay]);

  const focusCalendarOnDateInput = (dateStr: string) => {
    if (!dateStr) return;
    const date = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(date.getTime())) return;
    setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1));
    setSelectedDay(date.getDate());
  };

  const toISODateLocal = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getDeptColor = (deptName: string) => departments.find((d) => d.name === deptName)?.color || '#64748b';

  const formatDateShort = (dateStr?: string) => {
    if (!dateStr) return '--';
    const d = new Date(`${dateStr}T00:00:00`);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    return `${mm}-${dd}-${yy}`;
  };

  const formatTime12 = (time24?: string) => {
    if (!time24) return '--';
    const [h, m] = time24.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const getScheduleLogs = (member: StaffMember): ScheduleLog[] => {
    if (member.scheduleLogs && member.scheduleLogs.length > 0) {
      return member.scheduleLogs;
    }
    if (member.scheduleStart && member.scheduleEnd && member.scheduleTimeIn && member.scheduleTimeOut) {
      return [
        {
          id: member.id,
          startDate: member.scheduleStart,
          endDate: member.scheduleEnd,
          timeIn: member.scheduleTimeIn,
          timeOut: member.scheduleTimeOut,
        },
      ];
    }
    return [];
  };

  const getDaysInMonthFromLog = (log: ScheduleLog, year: number, month: number) => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month, getDaysInMonth(year, month));
    const logStart = new Date(`${log.startDate}T00:00:00`);
    const logEnd = new Date(`${log.endDate}T00:00:00`);
    if (Number.isNaN(logStart.getTime()) || Number.isNaN(logEnd.getTime()) || logEnd < monthStart || logStart > monthEnd) {
      return [] as number[];
    }

    const start = logStart < monthStart ? monthStart : logStart;
    const end = logEnd > monthEnd ? monthEnd : logEnd;
    const result: number[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      result.push(cursor.getDate());
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  };

  const getScheduledDaysForCurrentMonth = (member: StaffMember) => {
    const monthSet = new Set<number>();
    getScheduleLogs(member).forEach((log) => {
      getDaysInMonthFromLog(log, currentDate.getFullYear(), currentDate.getMonth()).forEach((d) => monthSet.add(d));
    });
    return Array.from(monthSet).sort((a, b) => a - b);
  };

  const getLogsForMonth = (member: StaffMember, year: number, month: number) =>
    getScheduleLogs(member)
      .filter((log) => getDaysInMonthFromLog(log, year, month).length > 0)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const getScheduledDaysForMonth = (member: StaffMember, year: number, month: number) => {
    const monthSet = new Set<number>();
    getLogsForMonth(member, year, month).forEach((log) => {
      getDaysInMonthFromLog(log, year, month).forEach((day) => monthSet.add(day));
    });
    return Array.from(monthSet).sort((a, b) => a - b);
  };

  const getMonthlyAbsencesForMonth = (member: StaffMember, year: number, month: number) => {
    const scheduledSet = new Set(getScheduledDaysForMonth(member, year, month));
    return member.absentDays.filter((day) => scheduledSet.has(day)).length;
  };

  const formatLogDateRange = (startDate: string, endDate: string, year: number, month: number) => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);

    const clippedStart = start < monthStart ? monthStart : start;
    const clippedEnd = end > monthEnd ? monthEnd : end;

    const startLabel = clippedStart.toLocaleDateString([], { month: 'short', day: 'numeric' });
    const endLabel = clippedEnd.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return `${startLabel} - ${endLabel}`;
  };

  const filteredStaffForDay = staff.filter((s) => {
    const scheduledDays = getScheduledDaysForCurrentMonth(s);
    return scheduledDays.includes(selectedDay) && (selectedDept === 'All Departments' || s.dept === selectedDept);
  });

  const addPersonnel = () => {
    if (!personForm.name.trim()) return;

    let finalDept = personForm.dept;
    if (personForm.isNewDept && personForm.newDeptName.trim()) {
      setDepartments([...departments, { name: personForm.newDeptName.trim(), color: personForm.newDeptColor }]);
      finalDept = personForm.newDeptName.trim();
    }
    const newMember: StaffMember = {
      id: Date.now(),
      name: personForm.name.trim(),
      dept: finalDept,
      schedule: 'Not Set',
      assignedDays: [],
      absentDays: [],
      scheduleLogs: [],
    };
    setStaff([...staff, newMember]);
    setIsAddingPersonnel(false);
    setPersonForm({ name: '', dept: 'Lifeguard', isNewDept: false, newDeptName: '', newDeptColor: '#3b82f6' });
  };

  const removeAttendanceCardForDay = (id: number) => {
    const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay);
    const selectedISO = toISODateLocal(selectedDate);

    const addDaysISO = (dateStr: string, days: number) => {
      const date = new Date(`${dateStr}T00:00:00`);
      date.setDate(date.getDate() + days);
      return toISODateLocal(date);
    };

    setStaff((prev) =>
      prev.map((member) =>
        member.id === id
          ? (() => {
              const nextLogs = getScheduleLogs(member).flatMap((log) => {
                if (selectedISO < log.startDate || selectedISO > log.endDate) {
                  return [log];
                }
                if (log.startDate === log.endDate && log.startDate === selectedISO) {
                  return [] as ScheduleLog[];
                }
                if (log.startDate === selectedISO) {
                  return [{ ...log, startDate: addDaysISO(log.startDate, 1) }];
                }
                if (log.endDate === selectedISO) {
                  return [{ ...log, endDate: addDaysISO(log.endDate, -1) }];
                }
                return [
                  { ...log, endDate: addDaysISO(selectedISO, -1) },
                  {
                    ...log,
                    id: Date.now() + Math.floor(Math.random() * 1000),
                    startDate: addDaysISO(selectedISO, 1),
                  },
                ];
              });

              const latestLog = nextLogs[nextLogs.length - 1];
              return {
                ...member,
                assignedDays: getScheduledDaysForCurrentMonth({ ...member, scheduleLogs: nextLogs }),
                absentDays: member.absentDays.filter((day) => day !== selectedDay),
                scheduleLogs: nextLogs,
                scheduleStart: latestLog?.startDate,
                scheduleEnd: latestLog?.endDate,
                scheduleTimeIn: latestLog?.timeIn,
                scheduleTimeOut: latestLog?.timeOut,
                schedule: latestLog ? `${formatTime12(latestLog.timeIn)} - ${formatTime12(latestLog.timeOut)}` : 'Not Set',
              };
            })()
          : member,
      ),
    );
  };

  const calculateAssignedDays = (startDateStr: string, endDateStr: string) => {
    const startDate = new Date(`${startDateStr}T00:00:00`);
    const endDate = new Date(`${endDateStr}T00:00:00`);
    const newDays = new Set<number>();
    const current = new Date(startDate);
    while (current <= endDate) {
      if (current.getMonth() === currentDate.getMonth() && current.getFullYear() === currentDate.getFullYear()) {
        newDays.add(current.getDate());
      }
      current.setDate(current.getDate() + 1);
    }
    return Array.from(newDays);
  };

  const hasDateOverlap = (aStart: string, aEnd: string, bStart: string, bEnd: string) => {
    const left = new Date(`${aStart}T00:00:00`);
    const right = new Date(`${aEnd}T00:00:00`);
    const otherLeft = new Date(`${bStart}T00:00:00`);
    const otherRight = new Date(`${bEnd}T00:00:00`);
    return left <= otherRight && otherLeft <= right;
  };

  const applySchedule = () => {
    if (!scheduleForm.startDate || !scheduleForm.endDate) {
      window.alert('Please set both Start Date and End Date before applying schedule.');
      return;
    }
    if (scheduleForm.endDate < scheduleForm.startDate) {
      window.alert('End Date must be the same day or later than Start Date.');
      return;
    }

    const conflictedMembers: string[] = [];
    setStaff((prev) => {
      const nextStaff = prev.map((s) => {
        const isTarget = scheduleForm.targetType === 'person' ? s.id === parseInt(scheduleForm.id, 10) : s.dept === scheduleForm.id;
        if (!isTarget) return s;

        const existingLogs = getScheduleLogs(s);
        const hasConflict = existingLogs.some((log) =>
          hasDateOverlap(log.startDate, log.endDate, scheduleForm.startDate, scheduleForm.endDate),
        );

        if (hasConflict) {
          conflictedMembers.push(s.name);
          return s;
        }

        const nextLog: ScheduleLog = {
          id: Date.now() + s.id,
          startDate: scheduleForm.startDate,
          endDate: scheduleForm.endDate,
          timeIn: scheduleForm.startTime,
          timeOut: scheduleForm.endTime,
        };
        const mergedLogs = [...existingLogs, nextLog].sort((a, b) => a.startDate.localeCompare(b.startDate));
        return {
          ...s,
          assignedDays: Array.from(new Set([...s.assignedDays, ...calculateAssignedDays(nextLog.startDate, nextLog.endDate)])),
          scheduleLogs: mergedLogs,
          scheduleStart: nextLog.startDate,
          scheduleEnd: nextLog.endDate,
          scheduleTimeIn: nextLog.timeIn,
          scheduleTimeOut: nextLog.timeOut,
          schedule: `${formatTime12(nextLog.timeIn)} - ${formatTime12(nextLog.timeOut)}`,
        };
      });
      return nextStaff;
    });

    if (conflictedMembers.length > 0) {
      window.alert(`Schedule not applied for: ${conflictedMembers.join(', ')}. Date range overlaps an existing schedule.`);
    }
    setIsScheduling(false);
  };

  const saveEditStaff = () => {
    if (!editingStaff) return;
    const updated = { ...editingStaff };
    if (updated.scheduleStart && updated.scheduleEnd) {
      updated.assignedDays = calculateAssignedDays(updated.scheduleStart, updated.scheduleEnd);
      if (updated.scheduleTimeIn && updated.scheduleTimeOut) {
        updated.schedule = `${formatTime12(updated.scheduleTimeIn)} - ${formatTime12(updated.scheduleTimeOut)}`;
        const existingLogs = getScheduleLogs(updated);
        const editedLog: ScheduleLog = {
          id: editingLogId ?? Date.now() + updated.id,
          startDate: updated.scheduleStart,
          endDate: updated.scheduleEnd,
          timeIn: updated.scheduleTimeIn,
          timeOut: updated.scheduleTimeOut,
        };
        const hasTargetLog = existingLogs.some((log) => log.id === editedLog.id);
        const nextLogs = hasTargetLog
          ? existingLogs.map((log) => (log.id === editedLog.id ? editedLog : log))
          : [...existingLogs, editedLog];
        updated.scheduleLogs = nextLogs.sort((a, b) => a.startDate.localeCompare(b.startDate));
      }
    }
    setStaff(staff.map((st) => (st.id === updated.id ? updated : st)));
    setEditingStaff(null);
    setEditingLogId(null);
  };

  return (
    <div className="space-y-8">
      <Card className="p-8">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex flex-wrap gap-2">
            <select
              value={currentDate.getMonth()}
              onChange={(e) => setCurrentDate(new Date(currentDate.getFullYear(), parseInt(e.target.value, 10), 1))}
              className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-2 text-sm font-bold text-sky-700 outline-none"
            >
              {monthNames.map((m, i) => (
                <option key={m} value={i}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={currentDate.getFullYear()}
              onChange={(e) => setCurrentDate(new Date(parseInt(e.target.value, 10), currentDate.getMonth(), 1))}
              className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-2 text-sm font-bold text-sky-700 outline-none"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-600 outline-none"
            >
              <option>All Departments</option>
              {departments.map((d) => (
                <option key={d.name}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setIsAddingPersonnel(true)} icon={UserPlus} variant="outline">
              Add Personnel
            </Button>
            <Button
              onClick={() => {
                setScheduleForm((prev) => ({ ...prev, startDate: '', endDate: '' }));
                setIsScheduling(true);
              }}
              icon={Clock}
            >
              Set Schedule Range
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div
              key={d}
              className="bg-[#4898c1] p-4 text-center text-xs font-black tracking-widest text-white uppercase"
            >
              {d}
            </div>
          ))}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`e-${i}`} className="h-24 bg-white" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const scheduled = staff.filter((s) => {
              const monthDays = getScheduledDaysForCurrentMonth(s);
              return monthDays.includes(day) && (selectedDept === 'All Departments' || s.dept === selectedDept);
            });
            const isSelected = selectedDay === day;

            return (
              <div
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`group relative h-24 cursor-pointer bg-white p-3 transition-all hover:bg-sky-50 ${
                  isSelected ? 'ring-2 ring-sky-500 ring-inset z-10' : ''
                }`}
              >
                <span className={`text-sm font-black ${isSelected ? 'text-sky-600' : 'text-slate-300'}`}>{day}</span>
                <div className="mt-2 flex flex-wrap gap-1">
                  {scheduled.map((s) => {
                    const isAbsent = s.absentDays.includes(day);
                    return (
                      <div
                        key={s.id}
                        className={`h-2.5 w-2.5 rounded-full shadow-sm transition-all ${isAbsent ? 'ring-2 ring-red-600 ring-offset-1' : ''}`}
                        style={{ backgroundColor: getDeptColor(s.dept) }}
                        title={`${s.name} (${s.dept})`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-8">
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <h4 className="flex items-center gap-2 font-black tracking-tight text-slate-800 uppercase">
            <UserCheck className="text-sky-500" /> Mark Today's Attendance
          </h4>
          <div className="rounded-lg bg-sky-100 px-4 py-1.5 text-xs font-black text-sky-700">
            {monthNames[currentDate.getMonth()]} {selectedDay}, {currentDate.getFullYear()}
          </div>
          <Button
            onClick={() => {
              setMonthlyScheduleDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
              setIsMonthlyScheduleOpen(true);
            }}
            icon={CalendarIcon}
            variant="secondary"
            className="ml-auto min-w-40 justify-center"
          >
            View Monthly Schedule
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredStaffForDay.length > 0 ? (
            filteredStaffForDay.map((s) => {
              const isAbsentOnSelected = s.absentDays.includes(selectedDay);
              const selectedDateISO = toISODateLocal(new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay));
              const activeLog = getScheduleLogs(s).find(
                (log) => selectedDateISO >= log.startDate && selectedDateISO <= log.endDate,
              );
              const cardStart = activeLog?.startDate || s.scheduleStart;
              const cardEnd = activeLog?.endDate || s.scheduleEnd;
              const cardSchedule = activeLog
                ? `${formatTime12(activeLog.timeIn)} - ${formatTime12(activeLog.timeOut)}`
                : s.schedule;

              return (
                <div
                  key={s.id}
                  className="flex flex-col rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-all hover:border-sky-200"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black text-white"
                        style={{ backgroundColor: getDeptColor(s.dept) }}
                      >
                        {s.name[0]}
                      </div>
                      <div>
                        <p className="text-sm leading-none font-bold text-slate-800">{s.name}</p>
                        <p className="mt-1 text-[10px] font-black text-slate-400 uppercase">{s.dept}</p>
                      </div>
                    </div>
                    <select
                      value={isAbsentOnSelected ? 'Absent' : 'Present'}
                      onChange={(e) => {
                        setStaff(
                          staff.map((st) => {
                            if (st.id === s.id) {
                              const newAbs =
                                e.target.value === 'Absent'
                                  ? Array.from(new Set([...st.absentDays, selectedDay]))
                                  : st.absentDays.filter((d) => d !== selectedDay);
                              return { ...st, absentDays: newAbs };
                            }
                            return st;
                          }),
                        );
                      }}
                      className={`rounded-lg border-none px-3 py-1.5 text-[10px] font-black uppercase outline-none ${
                        isAbsentOnSelected ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                      }`}
                    >
                      <option value="Present">PRESENT</option>
                      <option value="Absent">ABSENT</option>
                    </select>
                  </div>

                  <div className="border-t border-slate-200 pt-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <CalendarIcon size={11} />
                          <span className="text-[10px] font-bold uppercase">
                            {formatDateShort(cardStart)} to {formatDateShort(cardEnd)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Clock size={11} />
                          <span className="text-[10px] font-bold uppercase">{cardSchedule}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            (() => {
                              setEditingLogId(activeLog?.id ?? null);
                              setEditingStaff({
                                ...s,
                                scheduleStart: cardStart,
                                scheduleEnd: cardEnd,
                                scheduleTimeIn: activeLog?.timeIn || s.scheduleTimeIn,
                                scheduleTimeOut: activeLog?.timeOut || s.scheduleTimeOut,
                              });
                            })()
                          }
                          className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-white hover:text-sky-600"
                          type="button"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => removeAttendanceCardForDay(s.id)}
                          className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-white hover:text-red-500"
                          type="button"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full rounded-3xl border-2 border-dashed border-slate-100 py-12 text-center font-bold text-slate-300 italic">
              No staff assigned to {monthNames[currentDate.getMonth()]} {selectedDay} in {selectedDept}
            </div>
          )}
        </div>
      </Card>

      <Modal isOpen={isAddingPersonnel} onClose={() => setIsAddingPersonnel(false)} title="Register Personnel">
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Full Name</label>
            <input
              className="w-full rounded-xl border-none bg-slate-50 p-4 font-bold"
              value={personForm.name}
              onChange={(e) => setPersonForm({ ...personForm, name: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2">
            <input
              type="checkbox"
              checked={personForm.isNewDept}
              onChange={(e) => setPersonForm({ ...personForm, isNewDept: e.target.checked })}
              className="h-4 w-4"
            />
            <span className="text-xs font-bold text-slate-600">Create new department?</span>
          </div>

          {!personForm.isNewDept ? (
            <div>
              <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Department</label>
              <select
                className="w-full rounded-xl bg-slate-50 p-4 font-bold"
                value={personForm.dept}
                onChange={(e) => setPersonForm({ ...personForm, dept: e.target.value })}
              >
                {departments.map((d) => (
                  <option key={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-black text-slate-400 uppercase">New Department Name</label>
                <input
                  className="w-full rounded-xl bg-slate-50 p-4 font-bold"
                  value={personForm.newDeptName}
                  onChange={(e) => setPersonForm({ ...personForm, newDeptName: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Theme Color</label>
                <input
                  type="color"
                  className="h-12 w-full cursor-pointer rounded-xl border-none bg-slate-50"
                  value={personForm.newDeptColor}
                  onChange={(e) => setPersonForm({ ...personForm, newDeptColor: e.target.value })}
                />
              </div>
            </div>
          )}

          <Button className="mt-4 w-full justify-center py-5" onClick={addPersonnel}>
            Add Member
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isMonthlyScheduleOpen}
        onClose={() => setIsMonthlyScheduleOpen(false)}
        title="Monthly Personnel Schedule"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <select
              className="rounded-xl bg-slate-50 p-3 text-sm font-bold text-slate-700"
              value={monthlyScheduleDate.getMonth()}
              onChange={(e) =>
                setMonthlyScheduleDate(new Date(monthlyScheduleDate.getFullYear(), parseInt(e.target.value, 10), 1))
              }
            >
              {monthNames.map((month, monthIndex) => (
                <option key={month} value={monthIndex}>
                  {month}
                </option>
              ))}
            </select>
            <select
              className="rounded-xl bg-slate-50 p-3 text-sm font-bold text-slate-700"
              value={monthlyScheduleDate.getFullYear()}
              onChange={(e) =>
                setMonthlyScheduleDate(new Date(parseInt(e.target.value, 10), monthlyScheduleDate.getMonth(), 1))
              }
            >
              {monthlyYearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="max-h-[52vh] space-y-3 overflow-y-auto pr-1">
            {staff.map((member) => {
              const logs = getLogsForMonth(member, monthlyScheduleDate.getFullYear(), monthlyScheduleDate.getMonth());
              const scheduledDays = getScheduledDaysForMonth(member, monthlyScheduleDate.getFullYear(), monthlyScheduleDate.getMonth());
              const monthlyAbsences = getMonthlyAbsencesForMonth(
                member,
                monthlyScheduleDate.getFullYear(),
                monthlyScheduleDate.getMonth(),
              );

              return (
                <div key={member.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-800">{member.name}</p>
                      <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">{member.dept}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-red-100 px-2 py-1 text-[10px] font-black text-red-600 uppercase">
                        {monthlyAbsences} off
                      </span>
                      <span className="rounded-lg bg-sky-50 px-2 py-1 text-[10px] font-black text-sky-700 uppercase">
                        {scheduledDays.length} day{scheduledDays.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  {logs.length > 0 ? (
                    <div className="space-y-2">
                      {logs.map((log) => (
                        <div key={log.id} className="rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-600">
                          <p>
                            Date:{' '}
                            {formatLogDateRange(
                              log.startDate,
                              log.endDate,
                              monthlyScheduleDate.getFullYear(),
                              monthlyScheduleDate.getMonth(),
                            )}
                          </p>
                          <p className="mt-1">Time: {formatTime12(log.timeIn)} - {formatTime12(log.timeOut)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-400">No schedule this month</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!editingStaff}
        onClose={() => {
          setEditingStaff(null);
          setEditingLogId(null);
        }}
        title="Edit Personnel"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Full Name</label>
            <input
              className="w-full rounded-xl border-none bg-slate-50 p-4 font-bold"
              value={editingStaff?.name || ''}
              onChange={(e) => editingStaff && setEditingStaff({ ...editingStaff, name: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Department</label>
            <select
              className="w-full rounded-xl bg-slate-50 p-4 font-bold"
              value={editingStaff?.dept || ''}
              onChange={(e) => editingStaff && setEditingStaff({ ...editingStaff, dept: e.target.value })}
            >
              {departments.map((d) => (
                <option key={d.name}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Start Date</label>
              <input
                type="date"
                className="w-full rounded-xl border-none bg-slate-50 p-4 font-bold"
                value={editingStaff?.scheduleStart || ''}
                onChange={(e) => {
                  if (!editingStaff) return;
                  const nextDate = e.target.value;
                  setEditingStaff({ ...editingStaff, scheduleStart: nextDate });
                  focusCalendarOnDateInput(nextDate);
                }}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-black text-slate-400 uppercase">End Date</label>
              <input
                type="date"
                className="w-full rounded-xl border-none bg-slate-50 p-4 font-bold"
                value={editingStaff?.scheduleEnd || ''}
                onChange={(e) => {
                  if (!editingStaff) return;
                  const nextDate = e.target.value;
                  setEditingStaff({ ...editingStaff, scheduleEnd: nextDate });
                  focusCalendarOnDateInput(nextDate);
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Time In</label>
              <input
                type="time"
                className="w-full rounded-xl border-none bg-slate-50 p-4 font-bold"
                value={editingStaff?.scheduleTimeIn || ''}
                onChange={(e) => editingStaff && setEditingStaff({ ...editingStaff, scheduleTimeIn: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Time Out</label>
              <input
                type="time"
                className="w-full rounded-xl border-none bg-slate-50 p-4 font-bold"
                value={editingStaff?.scheduleTimeOut || ''}
                onChange={(e) => editingStaff && setEditingStaff({ ...editingStaff, scheduleTimeOut: e.target.value })}
              />
            </div>
          </div>

          <Button className="mt-4 w-full justify-center py-5" onClick={saveEditStaff}>
            Update Records
          </Button>
        </div>
      </Modal>

      <Modal isOpen={isScheduling} onClose={() => setIsScheduling(false)} title="Set Schedule Range">
        <div className="space-y-6">
          <div className="flex rounded-2xl bg-slate-100 p-1">
            <button
              onClick={() => setScheduleForm({ ...scheduleForm, targetType: 'person' })}
              className={`flex-1 rounded-xl py-3 text-sm font-bold ${
                scheduleForm.targetType === 'person' ? 'bg-white text-sky-600 shadow' : 'text-slate-500'
              }`}
              type="button"
            >
              Specific Person
            </button>
            <button
              onClick={() => setScheduleForm({ ...scheduleForm, targetType: 'dept' })}
              className={`flex-1 rounded-xl py-3 text-sm font-bold ${
                scheduleForm.targetType === 'dept' ? 'bg-white text-sky-600 shadow' : 'text-slate-500'
              }`}
              type="button"
            >
              By Department
            </button>
          </div>

          <select
            className="w-full rounded-xl border-none bg-slate-50 p-4 font-bold"
            value={scheduleForm.id}
            onChange={(e) => setScheduleForm({ ...scheduleForm, id: e.target.value })}
          >
            {scheduleForm.targetType === 'person'
              ? staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))
              : departments.map((d) => <option key={d.name}>{d.name}</option>)}
          </select>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Start Date</label>
              <input
                type="date"
                className="w-full rounded-xl border-none bg-slate-50 p-4 font-bold"
                value={scheduleForm.startDate}
                onChange={(e) => {
                  const nextDate = e.target.value;
                  setScheduleForm({ ...scheduleForm, startDate: nextDate });
                  focusCalendarOnDateInput(nextDate);
                }}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-black text-slate-400 uppercase">End Date</label>
              <input
                type="date"
                className="w-full rounded-xl border-none bg-slate-50 p-4 font-bold"
                value={scheduleForm.endDate}
                onChange={(e) => {
                  const nextDate = e.target.value;
                  setScheduleForm({ ...scheduleForm, endDate: nextDate });
                  focusCalendarOnDateInput(nextDate);
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-xs font-black text-slate-400 uppercase">In</label>
              <input
                type="time"
                className="w-full rounded-xl border-none bg-slate-50 p-4 font-bold"
                value={scheduleForm.startTime}
                onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Out</label>
              <input
                type="time"
                className="w-full rounded-xl border-none bg-slate-50 p-4 font-bold"
                value={scheduleForm.endTime}
                onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
              />
            </div>
          </div>

          <Button className="w-full justify-center py-5" onClick={applySchedule}>
            Apply Schedule Update
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function MaintenanceModule({
  maintenance,
  setMaintenance,
  focusSection,
  onFocusConsumed,
}: {
  maintenance: MaintenanceTask[];
  setMaintenance: React.Dispatch<React.SetStateAction<MaintenanceTask[]>>;
  focusSection: 'pending' | null;
  onFocusConsumed: () => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);
  const [editRequestedAt, setEditRequestedAt] = useState('');
  const [editDoneAt, setEditDoneAt] = useState('');
  const [newRequest, setNewRequest] = useState({ area: '', task: '', cost: 0, recurrence: 'Once' as MaintenanceTask['recurrence'] });

  const activeTasks = maintenance.filter((m) => m.status === 'Pending');
  const doneTasks = maintenance.filter((m) => m.status === 'Done');

  const update = <K extends keyof MaintenanceTask>(id: number, field: K, value: MaintenanceTask[K]) =>
    setMaintenance(maintenance.map((m) => (m.id === id ? { ...m, [field]: value } : m)));

  const getNowDateTime = () =>
    new Date().toLocaleString([], {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  const formatDateTime = (value: Date) =>
    value.toLocaleString([], {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getNextRecurrenceDate = (base: Date, recurrence: MaintenanceTask['recurrence']) => {
    const next = new Date(base);
    if (recurrence === 'Daily') next.setDate(next.getDate() + 1);
    if (recurrence === 'Weekly') next.setDate(next.getDate() + 7);
    if (recurrence === 'Monthly') next.setMonth(next.getMonth() + 1);
    return next;
  };

  const toDateTimeLocalInput = (value?: string) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    const hh = String(parsed.getHours()).padStart(2, '0');
    const mm = String(parsed.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d}T${hh}:${mm}`;
  };

  const fromDateTimeLocalInput = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleString([], {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const updateStatus = (id: number, nextStatus: MaintenanceTask['status']) => {
    setMaintenance((prev) => {
      let generatedTask: MaintenanceTask | null = null;

      const updatedTasks = prev.map((m): MaintenanceTask => {
        if (m.id !== id) return m;
        if (m.status === nextStatus) return m;

        if (nextStatus === 'Done') {
          const doneAt = m.doneAt || getNowDateTime();
          if (m.recurrence !== 'Once') {
            const doneDate = new Date(doneAt);
            const safeDoneDate = Number.isNaN(doneDate.getTime()) ? new Date() : doneDate;
            const nextRequestedDate = getNextRecurrenceDate(safeDoneDate, m.recurrence);
            generatedTask = {
              ...m,
              id: Date.now() + Math.floor(Math.random() * 1000),
              status: 'Pending',
              requestedAt: formatDateTime(nextRequestedDate),
              doneAt: undefined,
            };
          }
          return { ...m, status: 'Done', doneAt };
        }
        return { ...m, status: 'Pending', doneAt: undefined };
      });

      return generatedTask ? [...updatedTasks, generatedTask] : updatedTasks;
    });
  };

  const deleteTask = (id: number) => setMaintenance(maintenance.filter((m) => m.id !== id));

  const addRequest = () => {
    if (!newRequest.area || !newRequest.task) return;
    setMaintenance([
      ...maintenance,
      {
        id: Date.now(),
        ...newRequest,
        status: 'Pending',
        priority: 'Low',
        requestedAt: getNowDateTime(),
        doneAt: undefined,
      },
    ]);
    setIsAdding(false);
    setNewRequest({ area: '', task: '', cost: 0, recurrence: 'Once' });
  };

  useEffect(() => {
    if (!focusSection) return;
    const timer = window.setTimeout(() => onFocusConsumed(), 2200);
    return () => window.clearTimeout(timer);
  }, [focusSection, onFocusConsumed]);

  const openEditTask = (task: MaintenanceTask) => {
    setEditingTask({ ...task });
    setEditRequestedAt(toDateTimeLocalInput(task.requestedAt));
    setEditDoneAt(toDateTimeLocalInput(task.doneAt));
  };

  const saveEditTask = () => {
    if (!editingTask) return;
    const nextRequestedAt = editRequestedAt ? fromDateTimeLocalInput(editRequestedAt) : editingTask.requestedAt;
    const nextDoneAt = editingTask.status === 'Done' ? (editDoneAt ? fromDateTimeLocalInput(editDoneAt) : editingTask.doneAt) : undefined;

    setMaintenance(
      maintenance.map((m) =>
        m.id === editingTask.id
          ? {
              ...editingTask,
              requestedAt: nextRequestedAt,
              doneAt: nextDoneAt,
            }
          : m,
      ),
    );
    setEditingTask(null);
    setEditRequestedAt('');
    setEditDoneAt('');
  };

  const TaskCard = ({ m }: { m: MaintenanceTask }) => (
    <Card className="p-6">
      <div className="mb-4 flex justify-between">
        <select
          value={m.status}
          onChange={(e) => updateStatus(m.id, e.target.value as MaintenanceTask['status'])}
          className={`rounded-lg px-3 py-1 text-[10px] font-black uppercase outline-none ${
            m.status === 'Done' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
          }`}
        >
          <option value="Pending">Pending</option>
          <option value="Done">Done</option>
        </select>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openEditTask(m)}
            className="rounded-lg p-1.5 text-sky-600 transition-colors hover:bg-sky-50"
            aria-label="Edit task"
          >
            <Edit2 size={14} />
          </button>
          <button
            type="button"
            onClick={() => deleteTask(m.id)}
            className="rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-50"
            aria-label="Delete task"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <h4 className="mb-1 font-bold text-slate-800">{m.area}</h4>
      <p className="mb-4 text-xs text-slate-400">{m.task}</p>
      <div className="mb-3 space-y-1 border-t border-slate-100 pt-3">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500">
          <CalendarIcon size={11} /> Requested: {m.requestedAt}
        </p>
        <p className="text-[10px] font-bold uppercase text-slate-500">Repeat: {m.recurrence}</p>
        {m.status === 'Done' && (
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500">
            <CheckCircle2 size={11} /> Done: {m.doneAt || '--'}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 border-t pt-4 text-xs font-black text-sky-600">
        PHP
        <input
          type="number"
          placeholder="Add cost..."
          className="border-none bg-transparent p-0 outline-none focus:ring-0"
          value={m.cost || ''}
          onChange={(e) => update(m.id, 'cost', parseFloat(e.target.value) || 0)}
        />
      </div>
    </Card>
  );

  return (
    <div className="space-y-12">
      <Card className={`p-6 transition-all ${focusSection === 'pending' ? 'ring-2 ring-sky-500 ring-offset-2' : ''}`}>
        <div className="mb-6 flex items-center justify-between">
          <h4 className="flex items-center gap-2 text-base font-black tracking-tight text-slate-800 uppercase">
            <ListTodo size={16} className="text-sky-500" /> Pending Tasks
          </h4>
          <Button onClick={() => setIsAdding(true)} icon={Plus}>
            New Request
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {activeTasks.length > 0 ? activeTasks.map((m) => <TaskCard m={m} key={m.id} />) : <p className="font-bold text-slate-400 italic">No pending tasks</p>}
        </div>
      </Card>

      <Card className="p-6">
        <div className="space-y-4">
          <h4 className="flex items-center gap-2 text-base font-black tracking-tight text-slate-800 uppercase">
            <CheckCircle2 size={16} className="text-green-500" /> Resolved Tasks
          </h4>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">{doneTasks.map((m) => <TaskCard m={m} key={m.id} />)}</div>
        </div>
      </Card>

      <Modal isOpen={isAdding} onClose={() => setIsAdding(false)} title="New Maintenance Request">
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Area / Location</label>
            <input
              className="w-full rounded-xl border-none bg-slate-50 p-4 font-bold"
              value={newRequest.area}
              onChange={(e) => setNewRequest({ ...newRequest, area: e.target.value })}
              placeholder="e.g. Wave Pool, Room 101"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Task to Repair</label>
            <textarea
              className="h-32 w-full rounded-xl border-none bg-slate-50 p-4 font-bold"
              value={newRequest.task}
              onChange={(e) => setNewRequest({ ...newRequest, task: e.target.value })}
              placeholder="Describe the issue..."
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Estimated Cost (if needed)</label>
            <input
              type="number"
              className="w-full rounded-xl border-none bg-slate-50 p-4 font-bold"
              value={newRequest.cost}
              onChange={(e) => setNewRequest({ ...newRequest, cost: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Repetitive Schedule</label>
            <select
              className="w-full rounded-xl border-none bg-slate-50 p-4 font-bold"
              value={newRequest.recurrence}
              onChange={(e) => setNewRequest({ ...newRequest, recurrence: e.target.value as MaintenanceTask['recurrence'] })}
            >
              <option value="Once">Once</option>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
            </select>
          </div>
          <Button className="mt-4 w-full justify-center py-5" onClick={addRequest}>
            Submit Request
          </Button>
        </div>
      </Modal>

      <Modal isOpen={!!editingTask} onClose={() => setEditingTask(null)} title="Edit Maintenance Task">
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Area / Location</label>
            <input
              className="w-full rounded-xl border-none bg-slate-50 p-4 font-bold"
              value={editingTask?.area || ''}
              onChange={(e) => editingTask && setEditingTask({ ...editingTask, area: e.target.value })}
              placeholder="e.g. Wave Pool, Room 101"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Task to Repair</label>
            <textarea
              className="h-32 w-full rounded-xl border-none bg-slate-50 p-4 font-bold"
              value={editingTask?.task || ''}
              onChange={(e) => editingTask && setEditingTask({ ...editingTask, task: e.target.value })}
              placeholder="Describe the issue..."
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Cost</label>
            <input
              type="number"
              className="w-full rounded-xl border-none bg-slate-50 p-4 font-bold"
              value={editingTask?.cost ?? 0}
              onChange={(e) => editingTask && setEditingTask({ ...editingTask, cost: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Requested Date</label>
            <input
              type="datetime-local"
              className="w-full rounded-xl border-none bg-slate-50 p-4 font-bold"
              value={editRequestedAt}
              onChange={(e) => setEditRequestedAt(e.target.value)}
            />
          </div>
          {editingTask?.status === 'Done' && (
            <div>
              <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Done Date</label>
              <input
                type="datetime-local"
                className="w-full rounded-xl border-none bg-slate-50 p-4 font-bold"
                value={editDoneAt}
                onChange={(e) => setEditDoneAt(e.target.value)}
              />
            </div>
          )}
          <Button className="mt-4 w-full justify-center py-5" onClick={saveEditTask}>
            Save Changes
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function ParkingModule({
  parking,
  setParking,
  history,
  setHistory,
}: {
  parking: ParkingEntry[];
  setParking: React.Dispatch<React.SetStateAction<ParkingEntry[]>>;
  history: ParkingEntry[];
  setHistory: React.Dispatch<React.SetStateAction<ParkingEntry[]>>;
}) {
  const [vehicle, setVehicle] = useState({ type: 'Car', plate: '' });
  const [editingEntry, setEditingEntry] = useState<ParkingEntry | null>(null);
  const [activeSearch, setActiveSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const getNowDateTime = () =>
    new Date().toLocaleString([], {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  const recordEntry = () => {
    if (!vehicle.plate) return;
    setParking([{ id: Date.now(), ...vehicle, timeIn: getNowDateTime() }, ...parking]);
    setVehicle({ ...vehicle, plate: '' });
  };

  const recordExit = (p: ParkingEntry) => {
    setHistory([{ ...p, timeOut: getNowDateTime() }, ...history]);
    setParking(parking.filter((v) => v.id !== p.id));
  };

  const deleteHistory = (id: number) => setHistory(history.filter((h) => h.id !== id));

  const saveEdit = () => {
    if (!editingEntry) return;
    setHistory(history.map((h) => (h.id === editingEntry.id ? editingEntry : h)));
    setEditingEntry(null);
  };

  const filteredParking = parking.filter((entry) => {
    const query = activeSearch.trim().toLowerCase();
    if (!query) return true;
    return (
      entry.plate.toLowerCase().includes(query) ||
      entry.type.toLowerCase().includes(query) ||
      entry.timeIn.toLowerCase().includes(query)
    );
  });

  const filteredHistory = history.filter((entry) => {
    const query = historySearch.trim().toLowerCase();
    if (!query) return true;
    return (
      entry.plate.toLowerCase().includes(query) ||
      entry.type.toLowerCase().includes(query) ||
      entry.timeIn.toLowerCase().includes(query) ||
      (entry.timeOut || '').toLowerCase().includes(query)
    );
  });

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <Card className="h-fit p-8 lg:sticky lg:top-24">
        <h4 className="mb-4 text-base font-black tracking-tight text-slate-800 uppercase">Entry Registration</h4>
        <div className="mb-6 flex rounded-2xl bg-slate-100 p-1.5">
          <button
            onClick={() => setVehicle({ ...vehicle, type: 'Car' })}
            className={`flex-1 rounded-xl py-3 text-xs font-black transition-all ${
              vehicle.type === 'Car' ? 'bg-white text-sky-600 shadow' : 'text-slate-500'
            }`}
            type="button"
          >
            CAR / SUV
          </button>
          <button
            onClick={() => setVehicle({ ...vehicle, type: 'Motorcycle' })}
            className={`flex-1 rounded-xl py-3 text-xs font-black transition-all ${
              vehicle.type === 'Motorcycle' ? 'bg-white text-sky-600 shadow' : 'text-slate-500'
            }`}
            type="button"
          >
            MOTORCYCLE
          </button>
        </div>
        <input
          className="mb-6 w-full rounded-2xl bg-slate-50 p-6 text-center font-mono text-4xl font-black uppercase outline-none ring-sky-100 focus:ring-2"
          placeholder="PLATE"
          value={vehicle.plate}
          onChange={(e) => setVehicle({ ...vehicle, plate: e.target.value.toUpperCase() })}
        />
        <Button className="w-full justify-center py-5" onClick={recordEntry}>
          Record Entry
        </Button>
      </Card>

      <div className="space-y-6 lg:col-span-2">
        <Card className="flex h-[360px] flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-3 bg-white p-4">
            <div className="flex items-center gap-3">
              <span className="text-base font-black tracking-tighter text-slate-800 uppercase">Active Parking Slots</span>
              <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-2 py-1">
                <Search size={12} className="text-slate-400" />
                <input
                  value={activeSearch}
                  onChange={(e) => setActiveSearch(e.target.value)}
                  placeholder="Search"
                  className="w-28 border-none bg-transparent text-[10px] font-bold text-slate-700 normal-case outline-none placeholder:text-slate-400"
                />
              </div>
            </div>
            <span className="text-xs font-black tracking-widest text-slate-600 uppercase">{filteredParking.length} Vehicles</span>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-[#4898c1] text-xs font-black tracking-widest text-white uppercase">
                <tr>
                  <th className="px-6 py-4">Plate</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Date and Time In</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredParking.length > 0 ? (
                  filteredParking.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-black">{p.plate}</td>
                      <td className="px-6 py-4">
                        <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500 uppercase">{p.type}</span>
                      </td>
                      <td className="px-6 py-4 font-black text-sky-600">{p.timeIn}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => recordExit(p)}
                          className="rounded-lg bg-red-50 px-3 py-1 text-xs font-black text-red-600 uppercase transition-colors hover:bg-red-100"
                          type="button"
                        >
                          Check Out
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-12 text-center font-bold text-slate-300 italic">
                      No vehicles parked
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="flex h-[360px] flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-3 bg-white p-4">
            <div className="flex items-center gap-3">
              <span className="text-base font-black tracking-tighter text-slate-800 uppercase">Parking History Records</span>
              <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-2 py-1">
                <Search size={12} className="text-slate-400" />
                <input
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search"
                  className="w-28 border-none bg-transparent text-[10px] font-bold normal-case text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>
            <span className="text-xs font-black tracking-widest text-slate-600 uppercase">{filteredHistory.length} Records</span>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-[#4898c1] text-xs font-black tracking-widest text-white uppercase">
                <tr>
                  <th className="px-6 py-4">Plate</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Date and Time In</th>
                  <th className="px-6 py-4">Date and Time Out</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-400">
                {filteredHistory.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-black text-slate-700">{h.plate}</td>
                    <td className="px-6 py-4">
                      <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500 uppercase">{h.type}</span>
                    </td>
                    <td className="px-6 py-4 font-medium">{h.timeIn}</td>
                    <td className="px-6 py-4 font-black text-red-500">{h.timeOut}</td>
                    <td className="flex justify-end gap-1 px-6 py-4 text-right">
                      <button
                        onClick={() => setEditingEntry(h)}
                        className="rounded-lg p-2 text-sky-600 transition-colors hover:bg-sky-50"
                        type="button"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => deleteHistory(h.id)}
                        className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-50"
                        type="button"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredHistory.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center font-bold text-slate-300 italic">
                      No parking history records
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal isOpen={!!editingEntry} onClose={() => setEditingEntry(null)} title="Edit History Record">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-black text-slate-400 uppercase">Plate Number</label>
            <input
              className="w-full rounded-xl bg-slate-50 p-4 font-bold"
              value={editingEntry?.plate || ''}
              onChange={(e) => editingEntry && setEditingEntry({ ...editingEntry, plate: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-black text-slate-400 uppercase">Entry Time</label>
              <input
                className="w-full rounded-xl bg-slate-50 p-4 font-bold"
                value={editingEntry?.timeIn || ''}
                onChange={(e) => editingEntry && setEditingEntry({ ...editingEntry, timeIn: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-black text-slate-400 uppercase">Exit Time</label>
              <input
                className="w-full rounded-xl bg-slate-50 p-4 font-bold"
                value={editingEntry?.timeOut || ''}
                onChange={(e) => editingEntry && setEditingEntry({ ...editingEntry, timeOut: e.target.value })}
              />
            </div>
          </div>
          <Button className="w-full justify-center py-4" onClick={saveEdit}>
            Save Changes
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function InventoryModule({
  inventory,
  setInventory,
  requisitions,
  setRequisitions,
  staff,
  departments,
  focusPanel,
  onFocusConsumed,
}: {
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  requisitions: RequisitionRecord[];
  setRequisitions: React.Dispatch<React.SetStateAction<RequisitionRecord[]>>;
  staff: StaffMember[];
  departments: Department[];
  focusPanel: 'warehouse' | null;
  onFocusConsumed: () => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingRequisition, setIsAddingRequisition] = useState(false);
  const [editingStockItem, setEditingStockItem] = useState<InventoryItem | null>(null);
  const [editingRequisition, setEditingRequisition] = useState<RequisitionRecord | null>(null);
  const [stockSearch, setStockSearch] = useState('');
  const [requisitionSearch, setRequisitionSearch] = useState('');
  const [newItem, setNewItem] = useState({ item: '', unit: 'pcs', qty: 0, minQty: 5, price: 0 });
  const activeInventory = inventory.filter((inv) => !inv.archived);
  const archivedInventory = inventory.filter((inv) => inv.archived);
  const [requisitionForm, setRequisitionForm] = useState({
    staffName: staff[0]?.name || '',
    department: departments[0]?.name || '',
    itemId: activeInventory[0]?.id || 0,
    quantity: 1,
  });

  const addItem = () => {
    if (!newItem.item) return;
    setInventory([...inventory, { id: Date.now(), loggedAt: new Date().toLocaleString(), archived: false, ...newItem }]);
    setIsAdding(false);
    setNewItem({ item: '', unit: 'pcs', qty: 0, minQty: 5, price: 0 });
  };

  const filteredStock = activeInventory.filter((inv) => {
    const query = stockSearch.trim().toLowerCase();
    if (!query) return true;
    return inv.item.toLowerCase().includes(query) || inv.unit.toLowerCase().includes(query);
  });

  const filteredArchivedStock = archivedInventory.filter((inv) => {
    const query = stockSearch.trim().toLowerCase();
    if (!query) return true;
    return inv.item.toLowerCase().includes(query) || inv.unit.toLowerCase().includes(query);
  });

  const filteredRequisitions = requisitions.filter((record) => {
    const query = requisitionSearch.trim().toLowerCase();
    if (!query) return true;
    const itemName = inventory.find((inv) => inv.id === record.itemId)?.item || 'Deleted Item';
    return (
      record.staffName.toLowerCase().includes(query) ||
      record.department.toLowerCase().includes(query) ||
      itemName.toLowerCase().includes(query)
    );
  });

  const applyStockAdjustments = (operations: { itemId: number; delta: number }[]) => {
    const nextInventory = [...inventory];

    for (const operation of operations) {
      const idx = nextInventory.findIndex((inv) => inv.id === operation.itemId);
      if (idx === -1) continue;

      const adjustedQty = nextInventory[idx].qty + operation.delta;
      if (adjustedQty < 0) return null;
      nextInventory[idx] = { ...nextInventory[idx], qty: adjustedQty };
    }

    return nextInventory;
  };

  const resetRequisitionForm = () => {
    setRequisitionForm({
      staffName: staff[0]?.name || '',
      department: departments[0]?.name || '',
      itemId: activeInventory[0]?.id || 0,
      quantity: 1,
    });
  };

  const archiveStockItem = (id: number) => {
    setInventory((prev) =>
      prev.map((inv) =>
        inv.id === id
          ? {
              ...inv,
              archived: true,
              archivedAt: new Date().toLocaleString(),
            }
          : inv,
      ),
    );
  };

  const retrieveStockItem = (id: number) => {
    setInventory((prev) =>
      prev.map((inv) =>
        inv.id === id
          ? {
              ...inv,
              archived: false,
              archivedAt: undefined,
            }
          : inv,
      ),
    );
  };

  const saveStockEdit = () => {
    if (!editingStockItem || !editingStockItem.item) return;
    setInventory(inventory.map((inv) => (inv.id === editingStockItem.id ? editingStockItem : inv)));
    setEditingStockItem(null);
  };

  const openAddRequisition = () => {
    resetRequisitionForm();
    setEditingRequisition(null);
    setIsAddingRequisition(true);
  };

  const openEditRequisition = (record: RequisitionRecord) => {
    setEditingRequisition(record);
    setRequisitionForm({
      staffName: record.staffName,
      department: record.department,
      itemId: record.itemId,
      quantity: record.quantity,
    });
    setIsAddingRequisition(true);
  };

  const saveRequisition = () => {
    const selectedItem = activeInventory.find((inv) => inv.id === requisitionForm.itemId);
    if (!selectedItem || requisitionForm.quantity <= 0) return;

    if (!editingRequisition) {
      const updatedInventory = applyStockAdjustments([{ itemId: requisitionForm.itemId, delta: -requisitionForm.quantity }]);
      if (!updatedInventory) {
        alert('Requested quantity is higher than available stock.');
        return;
      }

      setInventory(updatedInventory);
      setRequisitions([
        {
          id: Date.now(),
          staffName: requisitionForm.staffName,
          department: requisitionForm.department,
          itemId: requisitionForm.itemId,
          quantity: requisitionForm.quantity,
          requestedAt: new Date().toLocaleString(),
        },
        ...requisitions,
      ]);
      setIsAddingRequisition(false);
      resetRequisitionForm();
      return;
    }

    const updatedInventory = applyStockAdjustments([
      { itemId: editingRequisition.itemId, delta: editingRequisition.quantity },
      { itemId: requisitionForm.itemId, delta: -requisitionForm.quantity },
    ]);
    if (!updatedInventory) {
      alert('Requested quantity is higher than available stock.');
      return;
    }

    setInventory(updatedInventory);
    setRequisitions(
      requisitions.map((record) =>
        record.id === editingRequisition.id
          ? {
              ...record,
              staffName: requisitionForm.staffName,
              department: requisitionForm.department,
              itemId: requisitionForm.itemId,
              quantity: requisitionForm.quantity,
            }
          : record,
      ),
    );
    setEditingRequisition(null);
    setIsAddingRequisition(false);
    resetRequisitionForm();
  };

  const deleteRequisition = (id: number) => {
    const record = requisitions.find((req) => req.id === id);
    if (!record) return;

    const updatedInventory = applyStockAdjustments([{ itemId: record.itemId, delta: record.quantity }]);
    if (updatedInventory) {
      setInventory(updatedInventory);
    }
    setRequisitions(requisitions.filter((req) => req.id !== id));
  };

  useEffect(() => {
    if (!focusPanel) return;
    const timer = window.setTimeout(() => onFocusConsumed(), 2200);
    return () => window.clearTimeout(timer);
  }, [focusPanel, onFocusConsumed]);

  return (
    <div className="space-y-8">
      <Card className="flex h-[360px] flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <h3 className="font-black tracking-tighter text-slate-800 uppercase">Requisition Item</h3>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <Search size={14} className="text-slate-400" />
              <input
                value={requisitionSearch}
                onChange={(e) => setRequisitionSearch(e.target.value)}
                placeholder="Search records"
                className="w-36 border-none bg-transparent text-xs font-bold outline-none"
              />
            </div>
          </div>
          <Button icon={Plus} onClick={openAddRequisition}>
            Add Request
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 z-10 bg-[#4898c1] text-xs font-black tracking-widest text-white uppercase">
              <tr>
                <th className="px-6 py-4">Date and Time Logged</th>
                <th className="px-6 py-4">Staff</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Item</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {filteredRequisitions.length > 0 ? (
                filteredRequisitions.map((record) => {
                  const mappedItem = inventory.find((inv) => inv.id === record.itemId);
                  return (
                    <tr key={record.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 text-xs font-bold text-slate-500">{record.requestedAt}</td>
                      <td className="px-6 py-4 font-bold">{record.staffName}</td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">{record.department}</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-700">{mappedItem?.item || 'Deleted Item'}</td>
                      <td className="px-6 py-4">
                        <span className="rounded bg-amber-50 px-2 py-1 text-[10px] font-black text-amber-600">
                          {record.quantity} {mappedItem?.unit || ''}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => openEditRequisition(record)}
                            className="rounded-lg p-2 text-sky-600 transition-colors hover:bg-sky-50"
                            type="button"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => deleteRequisition(record.id)}
                            className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-50"
                            type="button"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-sm font-bold italic text-slate-300">
                    No requisition records
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card
        className={`flex h-[420px] flex-col overflow-hidden transition-all ${
          focusPanel === 'warehouse' ? 'ring-2 ring-sky-500 ring-offset-2' : ''
        }`}
      >
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <h3 className="font-black tracking-tighter text-slate-800 uppercase">Warehouse Stock</h3>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <Search size={14} className="text-slate-400" />
              <input
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                placeholder="Search items"
                className="w-36 border-none bg-transparent text-xs font-bold outline-none"
              />
            </div>
          </div>
          <Button icon={Plus} onClick={() => setIsAdding(true)}>
            Add Item
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 z-10 bg-[#4898c1] text-xs font-black tracking-widest text-white uppercase">
              <tr>
                <th className="px-6 py-4">Date and Time Logged</th>
                <th className="px-6 py-4">Item</th>
                <th className="px-6 py-4">Unit</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Min Qty</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {filteredStock.map((i) => (
                <tr key={i.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 text-xs font-bold text-slate-500">{i.loggedAt}</td>
                  <td className="px-6 py-4 font-bold">{i.item}</td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">{i.unit}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded px-2 py-1 text-[10px] font-black ${
                        i.qty <= i.minQty ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'
                      }`}
                    >
                      {i.qty} LEFT
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-400">{i.minQty}</td>
                  <td className="px-6 py-4 font-black text-sky-600">PHP{i.price.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setEditingStockItem({ ...i })}
                        className="rounded-lg p-2 text-sky-600 transition-colors hover:bg-sky-50"
                        type="button"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => archiveStockItem(i.id)}
                        className="rounded-lg p-2 text-amber-600 transition-colors hover:bg-amber-50"
                        type="button"
                      >
                        <Archive size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredArchivedStock.length > 0 && (
                <tr>
                  <td colSpan={7} className="bg-slate-100 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1 bg-slate-300" />
                      <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Archived Warehouse Stock</span>
                      <div className="h-px flex-1 bg-slate-300" />
                    </div>
                  </td>
                </tr>
              )}

              {filteredArchivedStock.map((item) => (
                <tr key={item.id} className="bg-slate-50/50 hover:bg-slate-100/70">
                  <td className="px-6 py-4 text-xs font-bold text-slate-500">{item.loggedAt}</td>
                  <td className="px-6 py-4 font-bold text-slate-700">
                    <p>{item.item}</p>
                    <p className="mt-1 text-[10px] font-black tracking-wide text-amber-700 uppercase">Archived: {item.archivedAt || '--'}</p>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">{item.unit}</td>
                  <td className="px-6 py-4 text-xs font-black text-slate-600">{item.qty}</td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-400">{item.minQty}</td>
                  <td className="px-6 py-4 font-black text-slate-600">PHP{item.price.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end">
                      <button
                        onClick={() => retrieveStockItem(item.id)}
                        className="rounded-lg p-2 text-sky-600 transition-colors hover:bg-sky-50"
                        type="button"
                      >
                        <RotateCcw size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredStock.length === 0 && filteredArchivedStock.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-sm font-bold italic text-slate-300">
                    No stock items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isAdding} onClose={() => setIsAdding(false)} title="Add Inventory Item">
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Item Name</label>
            <input
              className="w-full rounded-xl border-none bg-slate-50 p-4 font-bold"
              value={newItem.item}
              onChange={(e) => setNewItem({ ...newItem, item: e.target.value })}
              placeholder="e.g. Chlorine Tablets"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Unit</label>
              <input
                className="w-full rounded-xl border-none bg-slate-50 p-4 font-bold"
                value={newItem.unit}
                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                placeholder="pcs, bucket, etc."
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Quantity</label>
              <input
                type="number"
                className="w-full rounded-xl border-none bg-slate-50 p-4 font-bold"
                value={newItem.qty}
                onChange={(e) => setNewItem({ ...newItem, qty: parseInt(e.target.value, 10) || 0 })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Min Quantity</label>
              <input
                type="number"
                className="w-full rounded-xl border-none bg-slate-50 p-4 font-bold"
                value={newItem.minQty}
                onChange={(e) => setNewItem({ ...newItem, minQty: parseInt(e.target.value, 10) || 0 })}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Price (PHP)</label>
              <input
                type="number"
                className="w-full rounded-xl border-none bg-slate-50 p-4 font-bold"
                value={newItem.price}
                onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          <Button className="mt-4 w-full justify-center py-5" onClick={addItem}>
            Add to Inventory
          </Button>
        </div>
      </Modal>

      <Modal isOpen={!!editingStockItem} onClose={() => setEditingStockItem(null)} title="Edit Warehouse Item">
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Item Name</label>
            <input
              className="w-full rounded-xl border-none bg-slate-50 p-4 font-bold"
              value={editingStockItem?.item || ''}
              onChange={(e) => editingStockItem && setEditingStockItem({ ...editingStockItem, item: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Unit</label>
              <input
                className="w-full rounded-xl border-none bg-slate-50 p-4 font-bold"
                value={editingStockItem?.unit || ''}
                onChange={(e) => editingStockItem && setEditingStockItem({ ...editingStockItem, unit: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Quantity</label>
              <input
                type="number"
                className="w-full rounded-xl border-none bg-slate-50 p-4 font-bold"
                value={editingStockItem?.qty || 0}
                onChange={(e) =>
                  editingStockItem && setEditingStockItem({ ...editingStockItem, qty: parseInt(e.target.value, 10) || 0 })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Min Quantity</label>
              <input
                type="number"
                className="w-full rounded-xl border-none bg-slate-50 p-4 font-bold"
                value={editingStockItem?.minQty || 0}
                onChange={(e) =>
                  editingStockItem && setEditingStockItem({ ...editingStockItem, minQty: parseInt(e.target.value, 10) || 0 })
                }
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Price (PHP)</label>
              <input
                type="number"
                className="w-full rounded-xl border-none bg-slate-50 p-4 font-bold"
                value={editingStockItem?.price || 0}
                onChange={(e) =>
                  editingStockItem && setEditingStockItem({ ...editingStockItem, price: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
          </div>
          <Button className="mt-4 w-full justify-center py-5" onClick={saveStockEdit}>
            Save Item Changes
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isAddingRequisition}
        onClose={() => {
          setIsAddingRequisition(false);
          setEditingRequisition(null);
          resetRequisitionForm();
        }}
        title={editingRequisition ? 'Edit Requisition Item' : 'Requisition Item'}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Person (Staff)</label>
            <select
              className="w-full rounded-xl bg-slate-50 p-4 font-bold"
              value={requisitionForm.staffName}
              onChange={(e) => {
                const selectedStaff = staff.find((member) => member.name === e.target.value);
                setRequisitionForm({
                  ...requisitionForm,
                  staffName: e.target.value,
                  department: selectedStaff?.dept || requisitionForm.department,
                });
              }}
            >
              {staff.map((member) => (
                <option key={member.id}>{member.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Department</label>
            <select
              className="w-full rounded-xl bg-slate-50 p-4 font-bold"
              value={requisitionForm.department}
              onChange={(e) => setRequisitionForm({ ...requisitionForm, department: e.target.value })}
            >
              {departments.map((dept) => (
                <option key={dept.name}>{dept.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Item</label>
            <select
              className="w-full rounded-xl bg-slate-50 p-4 font-bold"
              value={requisitionForm.itemId}
              onChange={(e) => setRequisitionForm({ ...requisitionForm, itemId: parseInt(e.target.value, 10) })}
            >
              {activeInventory.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.item} ({inv.qty} {inv.unit})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Quantity</label>
            <input
              type="number"
              min={1}
              className="w-full rounded-xl border-none bg-slate-50 p-4 font-bold"
              value={requisitionForm.quantity}
              onChange={(e) => setRequisitionForm({ ...requisitionForm, quantity: parseInt(e.target.value, 10) || 1 })}
            />
          </div>

          <Button className="mt-4 w-full justify-center py-5" onClick={saveRequisition}>
            {editingRequisition ? 'Update Requisition' : 'Submit Requisition'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function MeetingsModule({
  meetings,
  setMeetings,
  staff,
}: {
  meetings: Meeting[];
  setMeetings: React.Dispatch<React.SetStateAction<Meeting[]>>;
  staff: StaffMember[];
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    date: '',
    time: '',
    attendees: [] as number[],
    priority: 'Low' as Meeting['priority'],
    recurrence: 'Once' as Meeting['recurrence'],
  });
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [minutesModalOpen, setMinutesModalOpen] = useState(false);
  const [activeMinutesMeetingId, setActiveMinutesMeetingId] = useState<number | null>(null);
  const [minutesDraft, setMinutesDraft] = useState('');
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const getMeetingDateObj = (date: string) => {
    const parsed = new Date(`${date}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const matchesSelectedPeriod = (meeting: Meeting) => {
    const dateObj = getMeetingDateObj(meeting.date);
    if (!dateObj) return false;
    return dateObj.getFullYear() === selectedYear && dateObj.getMonth() === selectedMonth;
  };

  const todayKey = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const tomorrowKey = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();

  const getMeetingTone = (meeting: Meeting) => {
    const dateObj = getMeetingDateObj(meeting.date);
    if (!dateObj) return { className: 'border-slate-200 bg-white', badge: '' };
    const meetingKey = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).getTime();
    if (meetingKey === todayKey) {
      return { className: 'border-orange-400 bg-orange-50/60', badge: 'Today' };
    }
    if (meetingKey === tomorrowKey) {
      return { className: 'border-amber-400 bg-amber-50/70', badge: 'Tomorrow' };
    }
    return { className: 'border-slate-200 bg-white', badge: '' };
  };

  const yearSet = new Set<number>([selectedYear, now.getFullYear()]);
  meetings.forEach((meeting) => {
    const dateObj = getMeetingDateObj(meeting.date);
    if (dateObj) yearSet.add(dateObj.getFullYear());
  });
  const yearOptions = Array.from(yearSet).sort((a, b) => a - b);

  const getMeetingDateTime = (meeting: Meeting) => {
    const parsed = new Date(`${meeting.date}T${meeting.time || '00:00'}`);
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
  };

  const toDateOnly = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    const parsed = new Date(year || 0, (month || 1) - 1, day || 1);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const toDateInputValue = (value: Date) => {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getNextMeetingDate = (date: string, recurrence: Meeting['recurrence']) => {
    const currentDate = toDateOnly(date);
    if (!currentDate) return date;
    const nextDate = new Date(currentDate);
    if (recurrence === 'Daily') nextDate.setDate(nextDate.getDate() + 1);
    if (recurrence === 'Weekly') nextDate.setDate(nextDate.getDate() + 7);
    if (recurrence === 'Monthly') nextDate.setMonth(nextDate.getMonth() + 1);
    return toDateInputValue(nextDate);
  };

  const pendingMeetings = meetings
    .filter((m) => m.status === 'Pending' && matchesSelectedPeriod(m))
    .sort((a, b) => getMeetingDateTime(a) - getMeetingDateTime(b));

  const doneMeetings = meetings
    .filter((m) => m.status === 'Done' && matchesSelectedPeriod(m))
    .sort((a, b) => getMeetingDateTime(b) - getMeetingDateTime(a));

  const addMeeting = () => {
    if (!newMeeting.title || !newMeeting.date) return;
    setMeetings([...meetings, { id: Date.now(), ...newMeeting, status: 'Pending', minutes: '' }]);
    setIsAdding(false);
    setNewMeeting({ title: '', date: '', time: '', attendees: [], priority: 'Low', recurrence: 'Once' });
  };

  const saveMeetingEdit = () => {
    if (!editingMeeting || !editingMeeting.title || !editingMeeting.date) return;

    setMeetings((prev) => {
      const original = prev.find((meeting) => meeting.id === editingMeeting.id);
      let generatedMeeting: Meeting | null = null;

      if (
        original &&
        original.status !== 'Done' &&
        editingMeeting.status === 'Done' &&
        editingMeeting.recurrence !== 'Once'
      ) {
        generatedMeeting = {
          ...editingMeeting,
          id: Date.now() + Math.floor(Math.random() * 1000),
          date: getNextMeetingDate(editingMeeting.date, editingMeeting.recurrence),
          status: 'Pending',
          minutes: '',
        };
      }

      const updated = prev.map((meeting) =>
        meeting.id === editingMeeting.id
          ? {
              ...meeting,
              title: editingMeeting.title,
              date: editingMeeting.date,
              time: editingMeeting.time,
              attendees: editingMeeting.attendees,
              priority: editingMeeting.priority,
              recurrence: editingMeeting.recurrence,
              status: editingMeeting.status,
              minutes: editingMeeting.minutes,
            }
          : meeting,
      );

      return generatedMeeting ? [...updated, generatedMeeting] : updated;
    });

    setEditingMeeting(null);
  };

  const updateMeeting = (id: number, updates: Partial<Meeting>) => {
    setMeetings(meetings.map((meeting) => (meeting.id === id ? { ...meeting, ...updates } : meeting)));
  };

  const handleStatusChange = (meeting: Meeting, status: Meeting['status']) => {
    setMeetings((prev) => {
      let generatedMeeting: Meeting | null = null;
      const updated = prev.map((item) => {
        if (item.id !== meeting.id) return item;
        if (item.status === status) return item;

        if (status === 'Done' && item.recurrence !== 'Once') {
          generatedMeeting = {
            ...item,
            id: Date.now() + Math.floor(Math.random() * 1000),
            date: getNextMeetingDate(item.date, item.recurrence),
            status: 'Pending',
            minutes: '',
          };
        }

        return { ...item, status };
      });

      return generatedMeeting ? [...updated, generatedMeeting] : updated;
    });

    if (status === 'Done') {
      setActiveMinutesMeetingId(meeting.id);
      setMinutesDraft(meeting.minutes || '');
      setMinutesModalOpen(true);
    }
  };

  const saveMinutes = () => {
    if (activeMinutesMeetingId === null) return;
    updateMeeting(activeMinutesMeetingId, { minutes: minutesDraft });
    setMinutesModalOpen(false);
    setActiveMinutesMeetingId(null);
    setMinutesDraft('');
  };

  const MeetingCard = ({ meeting }: { meeting: Meeting }) => {
    const tone = getMeetingTone(meeting);
    const statusTone =
      meeting.status === 'Done' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700';
    return (
      <Card key={meeting.id} className={`border-2 p-5 ${tone.className}`}>
        <div className="mb-4 flex items-start justify-between gap-2">
          <select
            value={meeting.status}
            onChange={(e) => handleStatusChange(meeting, e.target.value as Meeting['status'])}
            className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase outline-none ${statusTone}`}
          >
            <option value="Pending">Pending</option>
            <option value="Done">Done</option>
          </select>
          <div className="flex items-center gap-1.5">
            {tone.badge && meeting.status === 'Pending' && (
              <span
                className={`rounded-md px-2 py-1 text-[10px] font-black uppercase ${
                  tone.badge === 'Today' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'
                }`}
              >
                {tone.badge}
              </span>
            )}
            <button
              onClick={() => setEditingMeeting({ ...meeting })}
              className="rounded-lg p-1.5 text-sky-600 transition-colors hover:bg-sky-50"
              type="button"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => setMeetings(meetings.filter((mt) => mt.id !== meeting.id))}
              className="rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-50"
              type="button"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      <div className="mb-3 min-w-0">
        <h4 className="truncate text-lg font-black tracking-tight text-slate-800">{meeting.title}</h4>
      </div>
      <div className="mb-3 flex items-center gap-2 text-xs text-slate-400">
        <CalendarIcon size={12} />
        <span className="font-bold">{meeting.date}</span>
        <Clock size={12} className="ml-2" />
        <span className="font-bold">{meeting.time}</span>
      </div>
      <p className="text-[10px] font-black uppercase text-slate-400">Repeat: {meeting.recurrence}</p>
      <div className="mt-3 border-t pt-3">
        <p className="mb-2 text-[10px] font-black text-slate-400 uppercase">Attendees ({meeting.attendees.length})</p>
        <div className="flex flex-wrap gap-1">
          {meeting.attendees.map((aId) => {
            const member = staff.find((s) => s.id === aId);
            return member ? (
              <span key={aId} className="rounded-lg bg-sky-50 px-2 py-1 text-[10px] font-bold text-sky-600">
                {member.name}
              </span>
            ) : null;
          })}
        </div>
      </div>
      {meeting.status === 'Done' && (
        <div className="mt-3 border-t pt-3">
          <p className="mb-2 text-[10px] font-black text-slate-400 uppercase">Minutes of Meeting</p>
          <p className="max-h-24 overflow-y-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            {meeting.minutes || 'No minutes provided yet.'}
          </p>
        </div>
      )}
      </Card>
    );
  };

  const toggleAttendee = (id: number) => {
    setNewMeeting((prev) => ({
      ...prev,
      attendees: prev.attendees.includes(id) ? prev.attendees.filter((a) => a !== id) : [...prev.attendees, id],
    }));
  };

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="mb-5 flex items-center justify-between">
          <h4 className="flex items-center gap-2 text-base font-black tracking-tight text-slate-800 uppercase">
            <CalendarIcon size={16} className="text-sky-500" /> Scheduled Meetings
          </h4>
          <div className="flex items-center gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-2 text-sm font-bold text-sky-700 outline-none"
            >
              {monthNames.map((name, i) => (
                <option key={name} value={i}>
                  {name}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-2 text-sm font-bold text-sky-700 outline-none"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <Button onClick={() => setIsAdding(true)} icon={Plus}>
              Schedule Meeting
            </Button>
          </div>
        </div>

        <div className="h-[420px] overflow-y-auto pr-1">
          {pendingMeetings.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pendingMeetings.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-3xl border-4 border-dashed border-slate-200 p-12 text-center font-bold tracking-widest text-slate-300 uppercase">
              No meetings scheduled yet
            </div>
          )}
        </div>
      </Card>

      <Card className="p-5">
        <h4 className="mb-5 text-base font-black tracking-tight text-slate-800 uppercase">Done Meetings</h4>
        <div className="h-[420px] overflow-y-auto pr-1">
          {doneMeetings.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {doneMeetings.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-3xl border-4 border-dashed border-slate-200 p-12 text-center font-bold tracking-widest text-slate-300 uppercase">
              No done meetings yet
            </div>
          )}
        </div>
      </Card>

      <Modal isOpen={isAdding} onClose={() => setIsAdding(false)} title="Schedule a Meeting">
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Meeting Title</label>
            <input
              className="w-full rounded-xl border-none bg-slate-50 p-4 font-bold"
              value={newMeeting.title}
              onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
              placeholder="e.g. Weekly Staff Briefing"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Date</label>
              <input
                type="date"
                className="w-full rounded-xl border-none bg-slate-50 p-4 font-bold"
                value={newMeeting.date}
                onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Time</label>
              <input
                type="time"
                className="w-full rounded-xl border-none bg-slate-50 p-4 font-bold"
                value={newMeeting.time}
                onChange={(e) => setNewMeeting({ ...newMeeting, time: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Repetitive</label>
            <select
              className="w-full rounded-xl border-none bg-slate-50 p-4 font-bold"
              value={newMeeting.recurrence}
              onChange={(e) =>
                setNewMeeting({
                  ...newMeeting,
                  recurrence: e.target.value as Meeting['recurrence'],
                })
              }
            >
              <option value="Once">Once</option>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Select Attendees</label>
            <div className="max-h-40 space-y-2 overflow-y-auto">
              {staff.map((s) => (
                <label
                  key={s.id}
                  className="flex cursor-pointer items-center gap-3 rounded-xl bg-slate-50 p-3 transition-colors hover:bg-sky-50"
                >
                  <input
                    type="checkbox"
                    checked={newMeeting.attendees.includes(s.id)}
                    onChange={() => toggleAttendee(s.id)}
                    className="h-4 w-4 rounded"
                  />
                  <span className="text-sm font-bold text-slate-700">{s.name}</span>
                  <span className="ml-auto text-[10px] font-black text-slate-400 uppercase">{s.dept}</span>
                </label>
              ))}
            </div>
          </div>
          <Button className="mt-4 w-full justify-center py-5" onClick={addMeeting}>
            Create Meeting
          </Button>
        </div>
      </Modal>

      <Modal isOpen={minutesModalOpen} onClose={() => setMinutesModalOpen(false)} title="Minutes of Meeting">
        <div className="space-y-4">
          <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Minutes (Long Text)</label>
          <textarea
            className="h-40 w-full rounded-xl border-none bg-slate-50 p-4 font-bold"
            value={minutesDraft}
            onChange={(e) => setMinutesDraft(e.target.value)}
            placeholder="Write meeting minutes here..."
          />
          <Button className="w-full justify-center py-5" onClick={saveMinutes}>
            Save Minutes
          </Button>
        </div>
      </Modal>

      <Modal isOpen={!!editingMeeting} onClose={() => setEditingMeeting(null)} title="Edit Meeting">
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Meeting Title</label>
            <input
              className="w-full rounded-xl border-none bg-slate-50 p-4 font-bold"
              value={editingMeeting?.title || ''}
              onChange={(e) => editingMeeting && setEditingMeeting({ ...editingMeeting, title: e.target.value })}
              placeholder="e.g. Weekly Staff Briefing"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Date</label>
              <input
                type="date"
                className="w-full rounded-xl border-none bg-slate-50 p-4 font-bold"
                value={editingMeeting?.date || ''}
                onChange={(e) => editingMeeting && setEditingMeeting({ ...editingMeeting, date: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Time</label>
              <input
                type="time"
                className="w-full rounded-xl border-none bg-slate-50 p-4 font-bold"
                value={editingMeeting?.time || ''}
                onChange={(e) => editingMeeting && setEditingMeeting({ ...editingMeeting, time: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Status</label>
              <select
                className="w-full rounded-xl border-none bg-slate-50 p-4 font-bold"
                value={editingMeeting?.status || 'Pending'}
                onChange={(e) =>
                  editingMeeting &&
                  setEditingMeeting({ ...editingMeeting, status: e.target.value as Meeting['status'] })
                }
              >
                <option value="Pending">Pending</option>
                <option value="Done">Done</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Repetitive</label>
              <select
                className="w-full rounded-xl border-none bg-slate-50 p-4 font-bold"
                value={editingMeeting?.recurrence || 'Once'}
                onChange={(e) =>
                  editingMeeting &&
                  setEditingMeeting({ ...editingMeeting, recurrence: e.target.value as Meeting['recurrence'] })
                }
              >
                <option value="Once">Once</option>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>
          </div>
          {editingMeeting?.status === 'Done' && (
            <div>
              <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Minutes of Meeting</label>
              <textarea
                className="h-32 w-full rounded-xl border-none bg-slate-50 p-4 font-bold"
                value={editingMeeting?.minutes || ''}
                onChange={(e) => editingMeeting && setEditingMeeting({ ...editingMeeting, minutes: e.target.value })}
                placeholder="Write meeting minutes here..."
              />
            </div>
          )}
          <div>
            <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Select Attendees</label>
            <div className="max-h-40 space-y-2 overflow-y-auto">
              {staff.map((s) => (
                <label
                  key={s.id}
                  className="flex cursor-pointer items-center gap-3 rounded-xl bg-slate-50 p-3 transition-colors hover:bg-sky-50"
                >
                  <input
                    type="checkbox"
                    checked={editingMeeting?.attendees.includes(s.id) || false}
                    onChange={() =>
                      editingMeeting &&
                      setEditingMeeting({
                        ...editingMeeting,
                        attendees: editingMeeting.attendees.includes(s.id)
                          ? editingMeeting.attendees.filter((a) => a !== s.id)
                          : [...editingMeeting.attendees, s.id],
                      })
                    }
                    className="h-4 w-4 rounded"
                  />
                  <span className="text-sm font-bold text-slate-700">{s.name}</span>
                  <span className="ml-auto text-[10px] font-black text-slate-400 uppercase">{s.dept}</span>
                </label>
              ))}
            </div>
          </div>
          <Button className="mt-4 w-full justify-center py-5" onClick={saveMeetingEdit}>
            Save Changes
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function Overview({
  staff,
  setStaff,
  departments,
  meetings,
  inventory,
  maintenance,
  salesData,
  onOpenMeetings,
  onOpenSalesDashboard,
  onOpenInventoryWarehouse,
  onOpenMaintenancePending,
}: {
  staff: StaffMember[];
  setStaff: React.Dispatch<React.SetStateAction<StaffMember[]>>;
  departments: Department[];
  meetings: Meeting[];
  inventory: InventoryItem[];
  maintenance: MaintenanceTask[];
  salesData: SalesDataState;
  onOpenMeetings: () => void;
  onOpenSalesDashboard: () => void;
  onOpenInventoryWarehouse: () => void;
  onOpenMaintenancePending: () => void;
}) {
  const [isAllStaffOpen, setIsAllStaffOpen] = useState(false);
  const [isMonthlyScheduleOpen, setIsMonthlyScheduleOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [scheduleMonthDate, setScheduleMonthDate] = useState(new Date());
  const [trendRange, setTrendRange] = useState<'7d' | 'monthly' | 'yearly'>('7d');

  const toIsoDateLocal = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const todayIso = toIsoDateLocal(new Date());
  const todaySales = salesData.records.filter((record) => record.date === todayIso);
  const totalSalesToday = todaySales.reduce((sum, record) => sum + record.net, 0);

  const salesByDate = salesData.records.reduce(
    (acc, record) => {
      acc[record.date] = (acc[record.date] || 0) + record.net;
      return acc;
    },
    {} as Record<string, number>,
  );

  const salesByMonth = salesData.records.reduce(
    (acc, record) => {
      const monthKey = record.date.slice(0, 7);
      acc[monthKey] = (acc[monthKey] || 0) + record.net;
      return acc;
    },
    {} as Record<string, number>,
  );

  const salesByYear = salesData.records.reduce(
    (acc, record) => {
      const yearKey = record.date.slice(0, 4);
      acc[yearKey] = (acc[yearKey] || 0) + record.net;
      return acc;
    },
    {} as Record<string, number>,
  );

  const trendData = (() => {
    const now = new Date();
    if (trendRange === '7d') {
      return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - index));
        const key = toIsoDateLocal(date);
        return {
          label: date.toLocaleDateString([], { weekday: 'short' }),
          fullLabel: date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
          total: salesByDate[key] || 0,
        };
      });
    }

    if (trendRange === 'monthly') {
      return Array.from({ length: 12 }, (_, index) => {
        const date = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        return {
          label: date.toLocaleDateString([], { month: 'short' }),
          fullLabel: date.toLocaleDateString([], { month: 'short', year: 'numeric' }),
          total: salesByMonth[monthKey] || 0,
        };
      });
    }

    return Array.from({ length: 5 }, (_, index) => {
      const year = String(now.getFullYear() - (4 - index));
      return {
        label: year,
        fullLabel: year,
        total: salesByYear[year] || 0,
      };
    });
  })();

  const maxTrendTotal = Math.max(1, ...trendData.map((point) => point.total));

  const lowStockCount = inventory.filter((i) => !i.archived && i.qty <= i.minQty).length;
  const pendingIssueCount = maintenance.filter((m) => m.status === 'Pending').length;
  const stats = [
    {
      label: 'Total Sales Today',
      value: `PHP${totalSalesToday.toLocaleString()}`,
      icon: BarChart3,
      color: 'text-green-500',
      bg: 'bg-green-50',
      change: `${todaySales.length} ${todaySales.length === 1 ? 'SALE' : 'SALES'}`,
      onClick: onOpenSalesDashboard,
    },
    {
      label: 'Low Stock Items',
      value: String(lowStockCount),
      icon: Package,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
      change: lowStockCount > 0 ? `-${lowStockCount}` : '+0',
      onClick: onOpenInventoryWarehouse,
    },
    {
      label: 'Open Issues',
      value: String(pendingIssueCount),
      icon: AlertCircle,
      color: 'text-red-500',
      bg: 'bg-red-50',
      change: '-10%',
      onClick: onOpenMaintenancePending,
    },
  ];

  const activeStaff = staff.filter((member) => !member.archived);
  const activeStaffRecords = [...staff].filter((member) => !member.archived).sort((a, b) => a.name.localeCompare(b.name));
  const archivedStaffRecords = [...staff].filter((member) => member.archived).sort((a, b) => a.name.localeCompare(b.name));

  const todayDate = new Date();
  const windowStart = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
  const windowEnd = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate() + 2, 23, 59, 59);
  const nowMinutes = todayDate.getHours() * 60 + todayDate.getMinutes();

  const upcomingWindowMeetings = meetings
    .filter((meeting) => {
      if (meeting.status === 'Done') return false;
      const hasTime = Boolean(meeting.time?.trim());
      const [year, month, day] = meeting.date.split('-').map(Number);
      const [hours, minutes] = (meeting.time || '00:00').split(':').map(Number);
      const meetingDate = new Date(year, (month || 1) - 1, day || 1, hours || 0, minutes || 0);
      if (Number.isNaN(meetingDate.getTime())) return false;

      const isToday =
        meetingDate.getFullYear() === todayDate.getFullYear() &&
        meetingDate.getMonth() === todayDate.getMonth() &&
        meetingDate.getDate() === todayDate.getDate();

      if (isToday) {
        if (!hasTime) return true;
        return (hours || 0) * 60 + (minutes || 0) >= nowMinutes;
      }

      return meetingDate >= windowStart && meetingDate <= windowEnd;
    })
    .sort((a, b) => `${a.date} ${a.time || '00:00'}`.localeCompare(`${b.date} ${b.time || '00:00'}`));

  const upcomingMeeting = upcomingWindowMeetings[0];
  const upcomingMeetingCount = upcomingWindowMeetings.length;

  const getMeetingRelativeLabel = (meeting: Meeting) => {
    const meetingDate = new Date(`${meeting.date}T00:00:00`);
    if (Number.isNaN(meetingDate.getTime())) return 'Scheduled';
    const meetingKey = new Date(meetingDate.getFullYear(), meetingDate.getMonth(), meetingDate.getDate()).getTime();
    const todayKey = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate()).getTime();
    const tomorrowKey = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate() + 1).getTime();
    if (meetingKey === todayKey) return 'Today';
    if (meetingKey === tomorrowKey) return 'Tomorrow';
    return 'Upcoming';
  };

  const formatMeetingDateTime = (meeting: Meeting) => {
    const datePart = meeting.date
      ? new Date(`${meeting.date}T00:00:00`).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
      : '--';

    if (!meeting.time) {
      return `${datePart} | --:--`;
    }

    const [h, m] = meeting.time.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) {
      return `${datePart} | ${meeting.time}`;
    }
    const suffix = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    const timePart = `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`;
    return `${datePart} | ${timePart}`;
  };

  const getLogsForMonth = (member: StaffMember, year: number, month: number) => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    const sourceLogs = member.scheduleLogs && member.scheduleLogs.length > 0
      ? member.scheduleLogs
      : member.scheduleStart && member.scheduleEnd && member.scheduleTimeIn && member.scheduleTimeOut
        ? [
            {
              id: member.id,
              startDate: member.scheduleStart,
              endDate: member.scheduleEnd,
              timeIn: member.scheduleTimeIn,
              timeOut: member.scheduleTimeOut,
            },
          ]
        : [];

    return sourceLogs.filter((log) => {
      const start = new Date(`${log.startDate}T00:00:00`);
      const end = new Date(`${log.endDate}T00:00:00`);
      return start <= monthEnd && end >= monthStart;
    });
  };

  const getScheduledDaysForMonth = (member: StaffMember, year: number, month: number) => {
    const logs = getLogsForMonth(member, year, month);
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const days = new Set<number>();

    logs.forEach((log) => {
      const start = new Date(`${log.startDate}T00:00:00`);
      const end = new Date(`${log.endDate}T00:00:00`);
      const clippedStart = start < monthStart ? monthStart : start;
      const clippedEnd = end > monthEnd ? monthEnd : end;
      const cursor = new Date(clippedStart);

      while (cursor <= clippedEnd) {
        days.add(cursor.getDate());
        cursor.setDate(cursor.getDate() + 1);
      }
    });

    return Array.from(days).sort((a, b) => a - b);
  };

  const getMonthlyAbsencesForMonth = (member: StaffMember, year: number, month: number) => {
    const scheduledDays = new Set(getScheduledDaysForMonth(member, year, month));
    return member.absentDays.filter((day) => scheduledDays.has(day)).length;
  };

  const formatLogDateRange = (startDate: string, endDate: string, year: number, month: number) => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);

    const clippedStart = start < monthStart ? monthStart : start;
    const clippedEnd = end > monthEnd ? monthEnd : end;

    const startLabel = clippedStart.toLocaleDateString([], { month: 'short', day: 'numeric' });
    const endLabel = clippedEnd.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return `${startLabel} - ${endLabel}`;
  };

  const formatTimeRange = (timeIn: string, timeOut: string) => {
    const make12 = (value: string) => {
      const [hours, minutes] = value.split(':').map(Number);
      const hour12 = hours % 12 || 12;
      const suffix = hours >= 12 ? 'PM' : 'AM';
      return `${String(hour12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${suffix}`;
    };

    return `${make12(timeIn)} - ${make12(timeOut)}`;
  };

  const handleArchiveToggle = (id: number) => {
    setStaff((prev) => prev.map((member) => (member.id === id ? { ...member, archived: !member.archived } : member)));
  };

  const saveMemberEdit = () => {
    if (!editingMember) return;

    setStaff((prev) =>
      prev.map((member) =>
        member.id === editingMember.id ? { ...member, name: editingMember.name, dept: editingMember.dept } : member,
      ),
    );
    setEditingMember(null);
  };

  const years = Array.from({ length: 11 }, (_, index) => new Date().getFullYear() - 5 + index);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Card key={i} className="p-6">
            <button
              type="button"
              onClick={s.onClick}
              className="w-full text-left"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className={`rounded-xl p-3 ${s.bg} ${s.color}`}>
                  <s.icon size={24} />
                </div>
                <span
                  className={`rounded-lg px-2 py-1 text-[10px] font-black ${
                    s.label === 'Open Issues'
                      ? 'bg-red-100 text-red-700'
                      : s.label === 'Low Stock Items'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-green-100 text-green-700'
                  }`}
                >
                  {s.change}
                </span>
              </div>
              <p className="mb-1 text-xs font-bold text-slate-400">{s.label}</p>
              <h3 className="text-2xl font-black tracking-tight text-slate-800">{s.value}</h3>
            </button>
          </Card>
        ))}
        <Card className="p-0">
          <button
            className="h-full w-full rounded-2xl p-6 text-left transition-colors hover:bg-slate-50"
            onClick={onOpenMeetings}
            type="button"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                <CalendarIcon size={24} />
              </div>
              <span className="rounded-lg bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-700">
                {upcomingMeetingCount} {upcomingMeetingCount === 1 ? 'MEETING' : 'MEETINGS'}
              </span>
            </div>
            <p className="mb-1 text-xs font-bold text-slate-400">Upcoming Meeting</p>
            {upcomingMeeting ? (
              <>
                <p className="text-sm font-black text-slate-800">{upcomingMeeting.title}</p>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  <span className="mr-2 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase text-slate-700">
                    {getMeetingRelativeLabel(upcomingMeeting)}
                  </span>
                  {formatMeetingDateTime(upcomingMeeting)}
                </p>
              </>
            ) : (
              <p className="text-sm font-black text-slate-800">No upcoming meetings</p>
            )}
            {upcomingWindowMeetings.length > 1 && (
              <div className="mt-3 space-y-1 text-xs font-bold text-slate-500">
                {upcomingWindowMeetings.slice(1, 3).map((meeting) => (
                  <p key={meeting.id} className="truncate">
                    <span className="mr-2 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase text-slate-700">
                      {getMeetingRelativeLabel(meeting)}
                    </span>
                    {meeting.title} - {formatMeetingDateTime(meeting)}
                  </p>
                ))}
                {upcomingWindowMeetings.length > 3 && <p>+{upcomingWindowMeetings.length - 3} more meetings</p>}
              </div>
            )}
          </button>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div
            role="button"
            tabIndex={0}
            onClick={onOpenSalesDashboard}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenSalesDashboard();
              }
            }}
            className="h-full cursor-pointer rounded-2xl p-8 transition-colors hover:bg-slate-50"
          >
            <div className="mb-8 flex items-center justify-between">
              <h4 className="font-black tracking-tight text-slate-800 uppercase">Sales Trends</h4>
              <select
                value={trendRange}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setTrendRange(e.target.value as '7d' | 'monthly' | 'yearly')}
                className="rounded-lg bg-slate-50 p-2 text-xs font-bold outline-none"
              >
                <option value="7d">Last 7 Days</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div className="flex h-64 w-full items-end gap-3">
              {trendData.map((point) => (
                <div key={point.fullLabel} className="group flex flex-1 flex-col items-center gap-2">
                  <div
                    className="relative w-full rounded-t-xl bg-sky-50 transition-all group-hover:bg-sky-100"
                    style={{ height: `${Math.max(6, (point.total / maxTrendTotal) * 100)}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-sky-900 px-2 py-1 text-[10px] font-black whitespace-nowrap text-white opacity-0 transition-all group-hover:opacity-100">
                      PHP{Math.round(point.total).toLocaleString()}
                    </div>
                  </div>
                  <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">{point.label}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
        <Card className="p-8">
          <h4 className="mb-6 font-black tracking-tight text-slate-800 uppercase">Staff Designation</h4>
          <div className="space-y-4">
            {activeStaff.slice(0, 3).map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 font-black text-sky-600">
                    {s.name[0]}
                  </div>
                  <div>
                    <p className="text-sm leading-none font-bold text-slate-800">{s.name}</p>
                    <p className="mt-1 text-[10px] font-bold text-slate-400 uppercase">{s.dept}</p>
                  </div>
                </div>
                <div className="h-2 w-2 rounded-full bg-green-500 shadow-sm shadow-green-200" />
              </div>
            ))}
          </div>
          <button
            className="mt-6 w-full border-t py-4 text-xs font-black tracking-widest text-sky-600 uppercase transition-all hover:bg-slate-50"
            type="button"
            onClick={() => setIsAllStaffOpen(true)}
          >
            View All Staff
          </button>
        </Card>
      </div>

      <Modal isOpen={isAllStaffOpen} onClose={() => setIsAllStaffOpen(false)} title="All Staff Records">
        <div className="space-y-4">
          <div className="flex justify-center">
            <Button
              icon={CalendarIcon}
              variant="secondary"
              onClick={() => setIsMonthlyScheduleOpen(true)}
              className="min-w-40 justify-center"
            >
              View Monthly Schedule
            </Button>
          </div>

          <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
            {activeStaffRecords.map((member) => (
                <div key={member.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{member.name}</p>
                    <p className="mt-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">{member.dept}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase ${
                        member.archived ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {member.archived ? 'Archived' : 'Active'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingMember({ ...member })}
                      className="rounded-lg p-2 text-sky-600 transition-colors hover:bg-sky-100"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleArchiveToggle(member.id)}
                      className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-200"
                    >
                      {member.archived ? <RotateCcw size={14} /> : <Archive size={14} />}
                    </button>
                  </div>
                </div>
              ))}

            {archivedStaffRecords.length > 0 && (
              <>
                <div className="my-4 h-1.5 w-full rounded-full bg-slate-300" />
                {archivedStaffRecords.map((member) => (
                  <div key={member.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{member.name}</p>
                      <p className="mt-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">{member.dept}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-700 uppercase">Archived</span>
                      <button
                        type="button"
                        onClick={() => setEditingMember({ ...member })}
                        className="rounded-lg p-2 text-sky-600 transition-colors hover:bg-sky-100"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleArchiveToggle(member.id)}
                        className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-200"
                      >
                        <RotateCcw size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </Modal>

      <Modal isOpen={Boolean(editingMember)} onClose={() => setEditingMember(null)} title="Edit Staff Record">
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Staff Name</label>
            <input
              className="w-full rounded-xl bg-slate-50 p-4 font-bold"
              value={editingMember?.name || ''}
              onChange={(e) => editingMember && setEditingMember({ ...editingMember, name: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Assigned Department</label>
            <select
              className="w-full rounded-xl bg-slate-50 p-4 font-bold"
              value={editingMember?.dept || ''}
              onChange={(e) => editingMember && setEditingMember({ ...editingMember, dept: e.target.value })}
            >
              {departments.map((dept) => (
                <option key={dept.name} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
          <Button className="mt-4 w-full justify-center py-5" onClick={saveMemberEdit}>
            Save Changes
          </Button>
        </div>
      </Modal>

      <Modal isOpen={isMonthlyScheduleOpen} onClose={() => setIsMonthlyScheduleOpen(false)} title="Monthly Personnel Schedule">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <select
              className="rounded-xl bg-slate-50 p-3 text-sm font-bold text-slate-700"
              value={scheduleMonthDate.getMonth()}
              onChange={(e) =>
                setScheduleMonthDate(new Date(scheduleMonthDate.getFullYear(), parseInt(e.target.value, 10), 1))
              }
            >
              {[
                'January',
                'February',
                'March',
                'April',
                'May',
                'June',
                'July',
                'August',
                'September',
                'October',
                'November',
                'December',
              ].map((month, monthIndex) => (
                <option key={month} value={monthIndex}>
                  {month}
                </option>
              ))}
            </select>
            <select
              className="rounded-xl bg-slate-50 p-3 text-sm font-bold text-slate-700"
              value={scheduleMonthDate.getFullYear()}
              onChange={(e) =>
                setScheduleMonthDate(new Date(parseInt(e.target.value, 10), scheduleMonthDate.getMonth(), 1))
              }
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="max-h-[52vh] space-y-3 overflow-y-auto pr-1">
            {staff.map((member) => {
              const logs = getLogsForMonth(member, scheduleMonthDate.getFullYear(), scheduleMonthDate.getMonth());
              const scheduledDays = getScheduledDaysForMonth(member, scheduleMonthDate.getFullYear(), scheduleMonthDate.getMonth());
              const monthlyAbsences = getMonthlyAbsencesForMonth(member, scheduleMonthDate.getFullYear(), scheduleMonthDate.getMonth());

              return (
                <div key={member.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-800">{member.name}</p>
                      <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">{member.dept}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-red-100 px-2 py-1 text-[10px] font-black text-red-600 uppercase">
                        {monthlyAbsences} off
                      </span>
                      <span className="rounded-lg bg-sky-50 px-2 py-1 text-[10px] font-black text-sky-700 uppercase">
                        {scheduledDays.length} day{scheduledDays.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  {logs.length > 0 ? (
                    <div className="space-y-2">
                      {logs.map((log) => (
                        <div key={log.id} className="rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-600">
                          <p>
                            Date: {formatLogDateRange(log.startDate, log.endDate, scheduleMonthDate.getFullYear(), scheduleMonthDate.getMonth())}
                          </p>
                          <p className="mt-1">Time: {formatTimeRange(log.timeIn, log.timeOut)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-400">No schedule this month</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SalesAnalyticsModule({
  activeTab,
  salesData,
  setSalesData,
}: {
  activeTab: string;
  salesData: SalesDataState;
  setSalesData: React.Dispatch<React.SetStateAction<SalesDataState>>;
}) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const appendRecord = (record: Omit<SalesBookingRecord, 'id'>) => {
    setSalesData((prev) => ({
      ...prev,
      records: [{ id: Date.now(), ...record }, ...prev.records].slice(0, 400),
    }));
  };

  const updateConfig = (updates: Partial<SalesGlobalConfig>) => {
    setSalesData((prev) => ({ ...prev, config: { ...prev.config, ...updates } }));
  };

  let content: React.ReactNode;

  if (activeTab === 'sales-dashboard') {
    content = <SalesDashboard data={salesData} setSalesData={setSalesData} />;
  } else if (activeTab === 'sales-restaurant') {
    content = (
      <RestaurantSales
        data={salesData}
        setSalesData={setSalesData}
        onSaveRecord={appendRecord}
        onNotify={(message) => setToastMessage(message)}
      />
    );
  } else if (activeTab === 'sales-recreation') {
    content = (
      <RecreationSales
        data={salesData}
        setSalesData={setSalesData}
        onSaveRecord={appendRecord}
        onNotify={(message) => setToastMessage(message)}
      />
    );
  } else if (activeTab === 'sales-function') {
    content = (
      <FunctionSales
        data={salesData}
        setSalesData={setSalesData}
        onSaveRecord={appendRecord}
        onNotify={(message) => setToastMessage(message)}
      />
    );
  } else if (activeTab === 'sales-hotel') {
    content = (
      <HotelSales
        data={salesData}
        setSalesData={setSalesData}
        onSaveRecord={appendRecord}
        onNotify={(message) => setToastMessage(message)}
      />
    );
  } else {
    content = <SalesSettings data={salesData} setSalesData={setSalesData} onUpdateConfig={updateConfig} />;
  }

  return (
    <>
      {content}
      {toastMessage && (
        <div className="fixed left-1/2 top-6 z-50 w-[min(92vw,760px)] -translate-x-1/2 rounded-2xl border-2 border-green-300 bg-green-50 px-8 py-6 text-center shadow-2xl">
          <p className="text-2xl font-black uppercase tracking-wide text-green-800 sm:text-3xl">{toastMessage}</p>
        </div>
      )}
    </>
  );
}

function SalesSummaryBox({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'sky' | 'green' | 'amber';
}) {
  const tones = {
    sky: 'bg-sky-50 text-sky-700 border-sky-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
  };
  return (
    <div className={`rounded-xl border p-4 ${tones[tone || 'sky']}`}>
      <p className="text-xs font-black tracking-wide uppercase">{label}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}

function SalesDashboard({
  data,
  setSalesData,
}: {
  data: SalesDataState;
  setSalesData: React.Dispatch<React.SetStateAction<SalesDataState>>;
}) {
  const [editingRecord, setEditingRecord] = useState<SalesBookingRecord | null>(null);
  const [transactionSearch, setTransactionSearch] = useState('');
  const [moduleSortOrder, setModuleSortOrder] = useState<'asc' | 'desc' | null>(null);
  const totalRevenue = data.records.reduce((sum, entry) => sum + entry.net, 0);
  const totalDiscount = data.records.reduce((sum, entry) => sum + entry.discount, 0);

  const deleteRecord = (id: number) => {
    setSalesData((prev) => ({
      ...prev,
      records: prev.records.filter((record) => record.id !== id),
    }));
  };

  const saveEditedRecord = () => {
    if (!editingRecord) return;
    setSalesData((prev) => ({
      ...prev,
      records: prev.records.map((record) => (record.id === editingRecord.id ? editingRecord : record)),
    }));
    setEditingRecord(null);
  };

  const moduleRevenue = ['restaurant', 'recreation', 'function', 'hotel'].map((moduleName) => ({
    module: moduleName,
    revenue: data.records.filter((record) => record.module === moduleName).reduce((sum, record) => sum + record.net, 0),
  }));

  const dailyMap = new Map<string, number>();
  data.records.forEach((record) => {
    dailyMap.set(record.date, (dailyMap.get(record.date) || 0) + record.net);
  });
  const dailySeries = Array.from(dailyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-7)
    .map(([date, total]) => ({ date: date.slice(5), total }));

  const filteredRecords = data.records.filter((record) => {
    const query = transactionSearch.trim().toLowerCase();
    if (!query) return true;
    return (
      record.date.toLowerCase().includes(query) ||
      record.module.toLowerCase().includes(query) ||
      record.label.toLowerCase().includes(query)
    );
  });

  const displayedRecords = [...filteredRecords].sort((a, b) => {
    if (!moduleSortOrder) return b.id - a.id;
    const compareByModule =
      moduleSortOrder === 'asc'
        ? a.module.localeCompare(b.module)
        : b.module.localeCompare(a.module);
    if (compareByModule !== 0) return compareByModule;
    return b.date.localeCompare(a.date);
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SalesSummaryBox label="Total Net Sales" value={formatCurrency(totalRevenue)} tone="green" />
        <SalesSummaryBox label="Total Discounts" value={formatCurrency(totalDiscount)} tone="amber" />
        <SalesSummaryBox label="Transactions" value={String(data.records.length)} tone="sky" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h4 className="mb-4 text-base font-black tracking-tight text-slate-800 uppercase">Revenue by Module</h4>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moduleRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="module" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value) || 0)} />
                <Legend />
                <Bar dataKey="revenue" fill="#0284c7" name="Net Sales" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h4 className="mb-4 text-base font-black tracking-tight text-slate-800 uppercase">Recent 7-Day Trend</h4>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailySeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value) || 0)} />
                <Line type="monotone" dataKey="total" stroke="#16a34a" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h4 className="text-base font-black tracking-tight text-slate-800 uppercase">Latest Transactions</h4>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <Search size={14} className="text-slate-400" />
            <input
              className="w-52 bg-transparent text-xs font-bold text-slate-600 outline-none placeholder:text-slate-400"
              value={transactionSearch}
              onChange={(e) => setTransactionSearch(e.target.value)}
              placeholder="Search transactions..."
            />
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-[10px] font-black tracking-widest text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() =>
                      setModuleSortOrder((prev) => (prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc'))
                    }
                    className="flex items-center gap-1 text-[10px] font-black tracking-widest uppercase"
                  >
                    Module
                    <ChevronDown
                      size={12}
                      className={`transition-transform ${
                        moduleSortOrder === 'asc'
                          ? ''
                          : moduleSortOrder === 'desc'
                            ? 'rotate-180'
                            : 'opacity-40'
                      }`}
                    />
                  </button>
                </th>
                <th className="px-4 py-3">Label</th>
                <th className="px-4 py-3">Gross</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Net</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {displayedRecords.map((record) => (
                <tr key={record.id}>
                  <td className="px-4 py-3 font-bold text-slate-600">{record.date}</td>
                  <td className="px-4 py-3 capitalize">{record.module}</td>
                  <td className="px-4 py-3">{record.label}</td>
                  <td className="px-4 py-3">{formatCurrency(record.gross)}</td>
                  <td className="px-4 py-3 text-red-500">-{formatCurrency(record.discount)}</td>
                  <td className="px-4 py-3 font-black text-green-700">{formatCurrency(record.net)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingRecord({ ...record })}
                        className="rounded-lg p-2 text-sky-600 transition-colors hover:bg-sky-50"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteRecord(record.id)}
                        className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {displayedRecords.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    {data.records.length === 0 ? 'No sales records yet.' : 'No matching transactions.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={Boolean(editingRecord)} onClose={() => setEditingRecord(null)} title="Edit Transaction">
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Date</label>
            <input
              type="date"
              className="w-full rounded-xl bg-slate-50 p-4 font-bold"
              value={editingRecord?.date || ''}
              onChange={(e) =>
                editingRecord && setEditingRecord({ ...editingRecord, date: e.target.value })
              }
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Module</label>
            <select
              className="w-full rounded-xl bg-slate-50 p-4 font-bold"
              value={editingRecord?.module || 'restaurant'}
              onChange={(e) =>
                editingRecord &&
                setEditingRecord({
                  ...editingRecord,
                  module: e.target.value as SalesBookingRecord['module'],
                })
              }
            >
              <option value="restaurant">Restaurant</option>
              <option value="recreation">Recreation</option>
              <option value="function">Function</option>
              <option value="hotel">Hotel</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Label</label>
            <input
              className="w-full rounded-xl bg-slate-50 p-4 font-bold"
              value={editingRecord?.label || ''}
              onChange={(e) =>
                editingRecord && setEditingRecord({ ...editingRecord, label: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Gross</label>
              <input
                type="number"
                className="w-full rounded-xl bg-slate-50 p-4 font-bold"
                value={editingRecord?.gross ?? 0}
                onChange={(e) =>
                  editingRecord && setEditingRecord({ ...editingRecord, gross: safeNumber(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Discount</label>
              <input
                type="number"
                className="w-full rounded-xl bg-slate-50 p-4 font-bold"
                value={editingRecord?.discount ?? 0}
                onChange={(e) =>
                  editingRecord && setEditingRecord({ ...editingRecord, discount: safeNumber(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-black text-slate-400 uppercase">Net</label>
              <input
                type="number"
                className="w-full rounded-xl bg-slate-50 p-4 font-bold"
                value={editingRecord?.net ?? 0}
                onChange={(e) =>
                  editingRecord && setEditingRecord({ ...editingRecord, net: safeNumber(e.target.value) })
                }
              />
            </div>
          </div>
          <Button onClick={saveEditedRecord} className="w-full justify-center">
            Save Changes
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function RestaurantSales({
  data,
  setSalesData,
  onSaveRecord,
  onNotify,
}: {
  data: SalesDataState;
  setSalesData: React.Dispatch<React.SetStateAction<SalesDataState>>;
  onSaveRecord: (record: Omit<SalesBookingRecord, 'id'>) => void;
  onNotify: (message: string) => void;
}) {
  const [selectedItemId, setSelectedItemId] = useState(data.restaurantItems[0]?.id || 0);
  const [adultQty, setAdultQty] = useState(1);
  const [childQty, setChildQty] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [customerType, setCustomerType] = useState<'regular' | 'senior_pwd'>('regular');

  const selectedItem = data.restaurantItems.find((item) => item.id === selectedItemId);
  const gross = selectedItem ? selectedItem.adultRate * adultQty + selectedItem.childRate * childQty : 0;
  const grossLabel = isWeekendDate(date) ? 'Gross + Weekend' : 'Gross + Weekdays';
  const weekendSurcharge = isWeekendDate(date) ? gross * (data.config.weekendSurchargePct / 100) : 0;
  const discountedBase = gross + weekendSurcharge;
  const discountPct = Math.min(100, data.config.globalDiscountPct + (customerType === 'senior_pwd' ? data.config.seniorPwdDiscountPct : 0));
  const discountAmount = discountedBase * (discountPct / 100);
  const total = discountedBase - discountAmount;

  const submitSale = () => {
    if (!selectedItem) return;
    onSaveRecord({
      module: 'restaurant',
      label: `${selectedItem.name} (${adultQty}/${childQty})${customerType === 'senior_pwd' ? ' [Senior/PWD]' : ''}`,
      date,
      gross: discountedBase,
      discount: discountAmount,
      net: total,
    });
    onNotify('Restaurant sale added successfully.');
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h4 className="mb-4 text-base font-black tracking-tight text-slate-800 uppercase">Restaurant Sale Calculator</h4>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Menu Item</label>
            <select className="w-full rounded-xl bg-slate-50 p-4 font-bold" value={selectedItemId} onChange={(e) => setSelectedItemId(parseInt(e.target.value, 10))}>
              {data.restaurantItems.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Sale Date</label>
            <input type="date" className="w-full rounded-xl bg-slate-50 p-4 font-bold placeholder:text-slate-400" value={date} onChange={(e) => setDate(e.target.value)} placeholder="Select date" />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">{data.config.labels.restaurantAdult} Count</label>
            <input type="number" min={0} className="w-full rounded-xl bg-slate-50 p-4 font-bold placeholder:text-slate-400" value={adultQty} onChange={(e) => setAdultQty(parseInt(e.target.value, 10) || 0)} placeholder={`${data.config.labels.restaurantAdult} count`} />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">{data.config.labels.restaurantChild} Count</label>
            <input type="number" min={0} className="w-full rounded-xl bg-slate-50 p-4 font-bold placeholder:text-slate-400" value={childQty} onChange={(e) => setChildQty(parseInt(e.target.value, 10) || 0)} placeholder={`${data.config.labels.restaurantChild} count`} />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Discount Type</label>
            <select className="w-full rounded-xl bg-slate-50 p-4 font-bold" value={customerType} onChange={(e) => setCustomerType(e.target.value as 'regular' | 'senior_pwd')}>
              <option value="regular">Regular</option>
              <option value="senior_pwd">Senior/PWD</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={submitSale} className="w-full justify-center py-4 text-base">Add Sale</Button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <SalesSummaryBox label={grossLabel} value={formatCurrency(discountedBase)} tone="sky" />
          <SalesSummaryBox label={`Discount (${discountPct.toFixed(0)}%)`} value={formatCurrency(discountAmount)} tone="amber" />
          <SalesSummaryBox label="Net Total" value={formatCurrency(total)} tone="green" />
        </div>
      </Card>

      <EditableDualRateTable
        title="Restaurant Labels and Rates"
        adultLabel={data.config.labels.restaurantAdult}
        childLabel={data.config.labels.restaurantChild}
        rows={data.restaurantItems}
        onChangeRows={(rows) => setSalesData((prev) => ({ ...prev, restaurantItems: rows }))}
      />
    </div>
  );
}

function RecreationSales({
  data,
  setSalesData,
  onSaveRecord,
  onNotify,
}: {
  data: SalesDataState;
  setSalesData: React.Dispatch<React.SetStateAction<SalesDataState>>;
  onSaveRecord: (record: Omit<SalesBookingRecord, 'id'>) => void;
  onNotify: (message: string) => void;
}) {
  const [selectedItemId, setSelectedItemId] = useState(data.recreationItems[0]?.id || 0);
  const [adultQty, setAdultQty] = useState(1);
  const [childQty, setChildQty] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [customerType, setCustomerType] = useState<'regular' | 'senior_pwd'>('regular');

  const selectedItem = data.recreationItems.find((item) => item.id === selectedItemId);
  const gross = selectedItem ? selectedItem.adultRate * adultQty + selectedItem.childRate * childQty : 0;
  const grossLabel = isWeekendDate(date) ? 'Gross + Weekend' : 'Gross + Weekdays';
  const weekendSurcharge = isWeekendDate(date) ? gross * (data.config.weekendSurchargePct / 100) : 0;
  const discountedBase = gross + weekendSurcharge;
  const discountPct = Math.min(100, data.config.globalDiscountPct + (customerType === 'senior_pwd' ? data.config.seniorPwdDiscountPct : 0));
  const discountAmount = discountedBase * (discountPct / 100);
  const total = discountedBase - discountAmount;

  const submitSale = () => {
    if (!selectedItem) return;
    onSaveRecord({
      module: 'recreation',
      label: `${selectedItem.name} (${adultQty}/${childQty})${customerType === 'senior_pwd' ? ' [Senior/PWD]' : ''}`,
      date,
      gross: discountedBase,
      discount: discountAmount,
      net: total,
    });
    onNotify('Recreation sale added successfully.');
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h4 className="mb-4 text-base font-black tracking-tight text-slate-800 uppercase">Recreation Sale Calculator</h4>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Recreation Item</label>
            <select className="w-full rounded-xl bg-slate-50 p-4 font-bold" value={selectedItemId} onChange={(e) => setSelectedItemId(parseInt(e.target.value, 10))}>
              {data.recreationItems.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Sale Date</label>
            <input type="date" className="w-full rounded-xl bg-slate-50 p-4 font-bold placeholder:text-slate-400" value={date} onChange={(e) => setDate(e.target.value)} placeholder="Select date" />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">{data.config.labels.recreationAdult} Count</label>
            <input type="number" min={0} className="w-full rounded-xl bg-slate-50 p-4 font-bold placeholder:text-slate-400" value={adultQty} onChange={(e) => setAdultQty(parseInt(e.target.value, 10) || 0)} placeholder={`${data.config.labels.recreationAdult} count`} />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">{data.config.labels.recreationChild} Count</label>
            <input type="number" min={0} className="w-full rounded-xl bg-slate-50 p-4 font-bold placeholder:text-slate-400" value={childQty} onChange={(e) => setChildQty(parseInt(e.target.value, 10) || 0)} placeholder={`${data.config.labels.recreationChild} count`} />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Discount Type</label>
            <select className="w-full rounded-xl bg-slate-50 p-4 font-bold" value={customerType} onChange={(e) => setCustomerType(e.target.value as 'regular' | 'senior_pwd')}>
              <option value="regular">Regular</option>
              <option value="senior_pwd">Senior/PWD</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={submitSale} className="w-full justify-center py-4 text-base">Add Sale</Button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <SalesSummaryBox label={grossLabel} value={formatCurrency(discountedBase)} tone="sky" />
          <SalesSummaryBox label={`Discount (${discountPct.toFixed(0)}%)`} value={formatCurrency(discountAmount)} tone="amber" />
          <SalesSummaryBox label="Net Total" value={formatCurrency(total)} tone="green" />
        </div>
      </Card>

      <EditableDualRateTable
        title="Recreation Labels and Rates"
        adultLabel={data.config.labels.recreationAdult}
        childLabel={data.config.labels.recreationChild}
        rows={data.recreationItems}
        onChangeRows={(rows) => setSalesData((prev) => ({ ...prev, recreationItems: rows }))}
      />
    </div>
  );
}

function FunctionSales({
  data,
  setSalesData,
  onSaveRecord,
  onNotify,
}: {
  data: SalesDataState;
  setSalesData: React.Dispatch<React.SetStateAction<SalesDataState>>;
  onSaveRecord: (record: Omit<SalesBookingRecord, 'id'>) => void;
  onNotify: (message: string) => void;
}) {
  const [selectedRoomId, setSelectedRoomId] = useState(data.functionRooms[0]?.id || 0);
  const [persons, setPersons] = useState(40);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [customerType, setCustomerType] = useState<'regular' | 'senior_pwd'>('regular');

  const room = data.functionRooms.find((entry) => entry.id === selectedRoomId);
  const gross = room ? room.baseRate + room.perHeadRate * persons : 0;
  const grossLabel = isWeekendDate(date) ? 'Gross + Weekend' : 'Gross + Weekdays';
  const weekendSurcharge = isWeekendDate(date) ? gross * (data.config.weekendSurchargePct / 100) : 0;
  const discountedBase = gross + weekendSurcharge;
  const discountPct = Math.min(100, data.config.globalDiscountPct + (customerType === 'senior_pwd' ? data.config.seniorPwdDiscountPct : 0));
  const discountAmount = discountedBase * (discountPct / 100);
  const total = discountedBase - discountAmount;

  const submitBooking = () => {
    if (!room) return;
    onSaveRecord({
      module: 'function',
      label: `${room.name} (${persons} pax)${customerType === 'senior_pwd' ? ' [Senior/PWD]' : ''}`,
      date,
      gross: discountedBase,
      discount: discountAmount,
      net: total,
    });
    onNotify('Function booking added successfully.');
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h4 className="mb-4 text-base font-black tracking-tight text-slate-800 uppercase">Function Cost Calculator</h4>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Event Room</label>
            <select className="w-full rounded-xl bg-slate-50 p-4 font-bold" value={selectedRoomId} onChange={(e) => setSelectedRoomId(parseInt(e.target.value, 10))}>
              {data.functionRooms.map((entry) => (
                <option key={entry.id} value={entry.id}>{entry.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Event Date</label>
            <input type="date" className="w-full rounded-xl bg-slate-50 p-4 font-bold placeholder:text-slate-400" value={date} onChange={(e) => setDate(e.target.value)} placeholder="Select event date" />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Number of Persons</label>
            <input type="number" min={1} className="w-full rounded-xl bg-slate-50 p-4 font-bold placeholder:text-slate-400" value={persons} onChange={(e) => setPersons(parseInt(e.target.value, 10) || 1)} placeholder="No. of persons" />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Discount Type</label>
            <select className="w-full rounded-xl bg-slate-50 p-4 font-bold" value={customerType} onChange={(e) => setCustomerType(e.target.value as 'regular' | 'senior_pwd')}>
              <option value="regular">Regular</option>
              <option value="senior_pwd">Senior/PWD</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={submitBooking} className="w-full justify-center py-4 text-base">Add Booking</Button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <SalesSummaryBox label={grossLabel} value={formatCurrency(discountedBase)} tone="sky" />
          <SalesSummaryBox label={`Discount (${discountPct.toFixed(0)}%)`} value={formatCurrency(discountAmount)} tone="amber" />
          <SalesSummaryBox label="Net Total" value={formatCurrency(total)} tone="green" />
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-base font-black tracking-tight text-slate-800 uppercase">Function Rooms</h4>
          <Button
            variant="secondary"
            icon={Plus}
            onClick={() =>
              setSalesData((prev) => ({
                ...prev,
                functionRooms: [
                  ...prev.functionRooms,
                  { id: Date.now(), name: 'New Function Room', baseRate: 3000, perHeadRate: 120 },
                ],
              }))
            }
          >
            Add Room
          </Button>
        </div>
        <div className="mb-2 hidden grid-cols-4 gap-2 px-2 md:grid">
          <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Room Name</p>
          <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Base Rate</p>
          <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Per Person Rate</p>
          <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Action</p>
        </div>
        <div className="space-y-2">
          {data.functionRooms.map((entry) => (
            <div key={entry.id} className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 p-3 md:grid-cols-4">
              <input className="rounded-lg bg-slate-50 p-2 text-sm font-bold placeholder:text-slate-400" value={entry.name} onChange={(e) => setSalesData((prev) => ({ ...prev, functionRooms: prev.functionRooms.map((roomEntry) => roomEntry.id === entry.id ? { ...roomEntry, name: e.target.value } : roomEntry) }))} placeholder="Function room name" />
              <input type="number" className="rounded-lg bg-slate-50 p-2 text-sm font-bold placeholder:text-slate-400" value={entry.baseRate} onChange={(e) => setSalesData((prev) => ({ ...prev, functionRooms: prev.functionRooms.map((roomEntry) => roomEntry.id === entry.id ? { ...roomEntry, baseRate: safeNumber(e.target.value) } : roomEntry) }))} placeholder="Base rate" />
              <input type="number" className="rounded-lg bg-slate-50 p-2 text-sm font-bold placeholder:text-slate-400" value={entry.perHeadRate} onChange={(e) => setSalesData((prev) => ({ ...prev, functionRooms: prev.functionRooms.map((roomEntry) => roomEntry.id === entry.id ? { ...roomEntry, perHeadRate: safeNumber(e.target.value) } : roomEntry) }))} placeholder="Per head rate" />
              <button type="button" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-600" onClick={() => setSalesData((prev) => ({ ...prev, functionRooms: prev.functionRooms.filter((roomEntry) => roomEntry.id !== entry.id) }))}>
                Remove
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function HotelSales({
  data,
  setSalesData,
  onSaveRecord,
  onNotify,
}: {
  data: SalesDataState;
  setSalesData: React.Dispatch<React.SetStateAction<SalesDataState>>;
  onSaveRecord: (record: Omit<SalesBookingRecord, 'id'>) => void;
  onNotify: (message: string) => void;
}) {
  const [selectedRoomId, setSelectedRoomId] = useState(data.hotelRooms[0]?.id || 0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [nights, setNights] = useState(1);
  const [addonSelections, setAddonSelections] = useState<Record<number, number>>({});
  const [customerType, setCustomerType] = useState<'regular' | 'senior_pwd'>('regular');

  const room = data.hotelRooms.find((entry) => entry.id === selectedRoomId);
  const baseNightRate = room ? (isWeekendDate(date) ? room.weekendRate : room.weekdayRate) : 0;
  const roomTotal = baseNightRate * nights;
  const addonTotal = data.hotelAddons.reduce((sum, addon) => sum + addon.charge * (addonSelections[addon.id] || 0), 0);
  const gross = roomTotal + addonTotal;
  const discountPct = Math.min(100, data.config.globalDiscountPct + (customerType === 'senior_pwd' ? data.config.seniorPwdDiscountPct : 0));
  const discountAmount = gross * (discountPct / 100);
  const total = gross - discountAmount;

  const submitBooking = () => {
    if (!room) return;
    onSaveRecord({
      module: 'hotel',
      label: `${room.name} (${nights} night${nights > 1 ? 's' : ''})${customerType === 'senior_pwd' ? ' [Senior/PWD]' : ''}`,
      date,
      gross,
      discount: discountAmount,
      net: total,
    });
    onNotify('Hotel booking added successfully.');
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h4 className="mb-4 text-base font-black tracking-tight text-slate-800 uppercase">Hotel Room Calculator</h4>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Room Type</label>
            <select className="w-full rounded-xl bg-slate-50 p-4 font-bold" value={selectedRoomId} onChange={(e) => setSelectedRoomId(parseInt(e.target.value, 10))}>
              {data.hotelRooms.map((entry) => (
                <option key={entry.id} value={entry.id}>{entry.name} - {entry.sizeLabel}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Check-in Date</label>
            <input type="date" className="w-full rounded-xl bg-slate-50 p-4 font-bold placeholder:text-slate-400" value={date} onChange={(e) => setDate(e.target.value)} placeholder="Check-in date" />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Number of Nights</label>
            <input type="number" min={1} className="w-full rounded-xl bg-slate-50 p-4 font-bold placeholder:text-slate-400" value={nights} onChange={(e) => setNights(parseInt(e.target.value, 10) || 1)} placeholder="Number of nights" />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Discount Type</label>
            <select className="w-full rounded-xl bg-slate-50 p-4 font-bold" value={customerType} onChange={(e) => setCustomerType(e.target.value as 'regular' | 'senior_pwd')}>
              <option value="regular">Regular</option>
              <option value="senior_pwd">Senior/PWD</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={submitBooking} className="w-full justify-center py-4 text-base">Add Booking</Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
          {data.hotelAddons.map((addon) => (
            <div key={addon.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
              <p className="text-sm font-bold">{addon.name} ({formatCurrency(addon.charge)})</p>
              <div className="w-24">
                <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Qty</label>
                <input
                  type="number"
                  min={0}
                  className="w-full rounded-lg bg-slate-50 p-2 text-sm font-bold placeholder:text-slate-400"
                  value={addonSelections[addon.id] || 0}
                  onChange={(e) => setAddonSelections((prev) => ({ ...prev, [addon.id]: parseInt(e.target.value, 10) || 0 }))}
                  placeholder="Qty"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <SalesSummaryBox label="Gross" value={formatCurrency(gross)} tone="sky" />
          <SalesSummaryBox label={`Discount (${discountPct.toFixed(0)}%)`} value={formatCurrency(discountAmount)} tone="amber" />
          <SalesSummaryBox label="Net Total" value={formatCurrency(total)} tone="green" />
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-base font-black tracking-tight text-slate-800 uppercase">Room Types and Add-ons</h4>
          <div className="flex gap-2">
            <Button variant="secondary" icon={Plus} onClick={() => setSalesData((prev) => ({ ...prev, hotelRooms: [...prev.hotelRooms, { id: Date.now(), name: 'New Room', sizeLabel: '2 Pax', weekdayRate: 2000, weekendRate: 2500 }] }))}>Add Room</Button>
            <Button variant="secondary" icon={Plus} onClick={() => setSalesData((prev) => ({ ...prev, hotelAddons: [...prev.hotelAddons, { id: Date.now(), name: 'New Add-on', charge: 200 }] }))}>Add Add-on</Button>
          </div>
        </div>
        <div className="space-y-2">
          <div className="hidden grid-cols-5 gap-2 px-2 md:grid">
            <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Room Name</p>
            <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Size Label</p>
            <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Weekday Rate</p>
            <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Weekend Rate</p>
            <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Action</p>
          </div>
          {data.hotelRooms.map((entry) => (
            <div key={entry.id} className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 p-3 md:grid-cols-5">
              <input className="rounded-lg bg-slate-50 p-2 text-sm font-bold placeholder:text-slate-400" value={entry.name} onChange={(e) => setSalesData((prev) => ({ ...prev, hotelRooms: prev.hotelRooms.map((roomEntry) => roomEntry.id === entry.id ? { ...roomEntry, name: e.target.value } : roomEntry) }))} placeholder="Room name" />
              <input className="rounded-lg bg-slate-50 p-2 text-sm font-bold placeholder:text-slate-400" value={entry.sizeLabel} onChange={(e) => setSalesData((prev) => ({ ...prev, hotelRooms: prev.hotelRooms.map((roomEntry) => roomEntry.id === entry.id ? { ...roomEntry, sizeLabel: e.target.value } : roomEntry) }))} placeholder="Room size label" />
              <input type="number" className="rounded-lg bg-slate-50 p-2 text-sm font-bold placeholder:text-slate-400" value={entry.weekdayRate} onChange={(e) => setSalesData((prev) => ({ ...prev, hotelRooms: prev.hotelRooms.map((roomEntry) => roomEntry.id === entry.id ? { ...roomEntry, weekdayRate: safeNumber(e.target.value) } : roomEntry) }))} placeholder="Weekday rate" />
              <input type="number" className="rounded-lg bg-slate-50 p-2 text-sm font-bold placeholder:text-slate-400" value={entry.weekendRate} onChange={(e) => setSalesData((prev) => ({ ...prev, hotelRooms: prev.hotelRooms.map((roomEntry) => roomEntry.id === entry.id ? { ...roomEntry, weekendRate: safeNumber(e.target.value) } : roomEntry) }))} placeholder="Weekend rate" />
              <button type="button" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-600" onClick={() => setSalesData((prev) => ({ ...prev, hotelRooms: prev.hotelRooms.filter((roomEntry) => roomEntry.id !== entry.id) }))}>Remove</button>
            </div>
          ))}
          <div className="mt-2 hidden grid-cols-3 gap-2 px-2 md:grid">
            <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Add-on Name</p>
            <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Extra Charge</p>
            <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Action</p>
          </div>
          {data.hotelAddons.map((addon) => (
            <div key={addon.id} className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 p-3 md:grid-cols-3">
              <input className="rounded-lg bg-slate-50 p-2 text-sm font-bold placeholder:text-slate-400" value={addon.name} onChange={(e) => setSalesData((prev) => ({ ...prev, hotelAddons: prev.hotelAddons.map((addonEntry) => addonEntry.id === addon.id ? { ...addonEntry, name: e.target.value } : addonEntry) }))} placeholder="Add-on name" />
              <input type="number" className="rounded-lg bg-slate-50 p-2 text-sm font-bold placeholder:text-slate-400" value={addon.charge} onChange={(e) => setSalesData((prev) => ({ ...prev, hotelAddons: prev.hotelAddons.map((addonEntry) => addonEntry.id === addon.id ? { ...addonEntry, charge: safeNumber(e.target.value) } : addonEntry) }))} placeholder="Add-on charge" />
              <button type="button" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-600" onClick={() => setSalesData((prev) => ({ ...prev, hotelAddons: prev.hotelAddons.filter((addonEntry) => addonEntry.id !== addon.id) }))}>Remove</button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function SalesSettings({
  data,
  setSalesData,
  onUpdateConfig,
}: {
  data: SalesDataState;
  setSalesData: React.Dispatch<React.SetStateAction<SalesDataState>>;
  onUpdateConfig: (updates: Partial<SalesGlobalConfig>) => void;
}) {
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const handleConfirmReset = () => {
    setSalesData((prev) => ({
      ...prev,
      config: {
        ...DEFAULT_SALES_DATA.config,
        globalDiscountPct: 0,
      },
    }));
    setIsResetConfirmOpen(false);
  };

  return (
    <>
      <div className="space-y-6">
      <Card className="p-6">
        <h4 className="mb-4 flex items-center gap-2 text-base font-black tracking-tight text-slate-800 uppercase">
          <SlidersHorizontal size={16} className="text-sky-500" /> Global Pricing Settings
        </h4>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-black text-slate-500 uppercase">Global Discount (%)</label>
            <input type="number" className="w-full rounded-xl bg-slate-50 p-3 font-bold placeholder:text-slate-400" value={data.config.globalDiscountPct} onChange={(e) => onUpdateConfig({ globalDiscountPct: safeNumber(e.target.value) })} placeholder="Global discount percent" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-black text-slate-500 uppercase">Weekend Surcharge (%)</label>
            <input type="number" className="w-full rounded-xl bg-slate-50 p-3 font-bold placeholder:text-slate-400" value={data.config.weekendSurchargePct} onChange={(e) => onUpdateConfig({ weekendSurchargePct: safeNumber(e.target.value) })} placeholder="Weekend surcharge percent" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-black text-slate-500 uppercase">Senior/PWD Discount (%)</label>
            <input type="number" className="w-full rounded-xl bg-slate-50 p-3 font-bold placeholder:text-slate-400" value={data.config.seniorPwdDiscountPct} onChange={(e) => onUpdateConfig({ seniorPwdDiscountPct: safeNumber(e.target.value) })} placeholder="Senior/PWD discount percent" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-base font-black tracking-tight text-slate-800 uppercase">Data Controls</h4>
          <Button
            variant="danger"
            onClick={() => setIsResetConfirmOpen(true)}
          >
            Reset to Default
          </Button>
        </div>
        <p className="text-sm text-slate-500">All sales modules use these global values in real-time and persist via local storage.</p>
      </Card>

      </div>

      <Modal isOpen={isResetConfirmOpen} onClose={() => setIsResetConfirmOpen(false)} title="Confirm Reset">
        <div className="space-y-6">
          <p className="text-sm font-medium text-slate-600">Reset pricing values to default and set Global Discount to 0%?</p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsResetConfirmOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleConfirmReset}>Reset</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function EditableDualRateTable<T extends { id: number; name: string; adultRate: number; childRate: number }>({
  title,
  adultLabel,
  childLabel,
  rows,
  onChangeRows,
}: {
  title: string;
  adultLabel: string;
  childLabel: string;
  rows: T[];
  onChangeRows: (rows: T[]) => void;
}) {
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-base font-black tracking-tight text-slate-800 uppercase">{title}</h4>
        <Button
          variant="secondary"
          icon={Plus}
          onClick={() =>
            onChangeRows([
              ...rows,
              { id: Date.now(), name: 'New Label', adultRate: 0, childRate: 0 } as T,
            ])
          }
        >
          Add Row
        </Button>
      </div>
      <div className="mb-2 hidden grid-cols-4 gap-2 px-2 md:grid">
        <div className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Label</div>
        <div className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">{adultLabel} Rate</div>
        <div className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">{childLabel} Rate</div>
        <div className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Action</div>
      </div>

      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.id} className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 p-3 md:grid-cols-4">
            <div>
              <input className="w-full rounded-lg bg-slate-50 p-2 text-sm font-bold placeholder:text-slate-400" value={row.name} onChange={(e) => onChangeRows(rows.map((entry) => entry.id === row.id ? { ...entry, name: e.target.value } : entry))} placeholder="Label name" />
            </div>
            <div>
              <input type="number" className="w-full rounded-lg bg-slate-50 p-2 text-sm font-bold placeholder:text-slate-400" value={row.adultRate} onChange={(e) => onChangeRows(rows.map((entry) => entry.id === row.id ? { ...entry, adultRate: safeNumber(e.target.value) } : entry))} placeholder={`${adultLabel} rate`} />
            </div>
            <div>
              <input type="number" className="w-full rounded-lg bg-slate-50 p-2 text-sm font-bold placeholder:text-slate-400" value={row.childRate} onChange={(e) => onChangeRows(rows.map((entry) => entry.id === row.id ? { ...entry, childRate: safeNumber(e.target.value) } : entry))} placeholder={`${childLabel} rate`} />
            </div>
            <div>
              <button type="button" className="w-full rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-600" onClick={() => onChangeRows(rows.filter((entry) => entry.id !== row.id))}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
