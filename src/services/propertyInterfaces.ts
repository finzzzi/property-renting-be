// Interface berdasarkan schema Prisma
export interface Booking {
  id: number;
  guest_id: string;
  room_id: number | null;
  check_in: Date;
  check_out: Date;
  total_price: number;
  payment_proof: string | null;
  status_id: number | null;
  created_at: Date | null;
  updated_at: Date | null;
}

export interface RoomUnavailability {
  id: number;
  room_id: number;
  start_date: Date;
  end_date: Date;
  created_at: Date | null;
}

export interface PeakSeasonRate {
  id: number;
  room_id: number | null;
  type: "percentage" | "fixed";
  value: number;
  start_date: Date;
  end_date: Date;
  created_at: Date | null;
  updated_at: Date | null;
}

export interface PropertyPicture {
  id: number;
  property_id: number;
  file_path: string;
  is_main: boolean | null;
  created_at: Date | null;
}

export interface RoomPicture {
  id: number;
  room_id: number | null;
  file_path: string | null;
  created_at: Date;
}

export interface City {
  id: number;
  name: string;
  type: string;
  created_at: Date | null;
  updated_at: Date | null;
}

export interface PropertyCategory {
  id: number;
  name: string;
  tenant_id: string | null;
  created_at: Date | null;
  updated_at: Date | null;
}

export interface ProcessedProperty {
  property_id: number;
  name: string;
  location: string;
  category: string | null;
  city_id: number;
  property_pictures: string | null;
  price: number;
  available_rooms: number;
}

export interface ProcessedRoom {
  id: number;
  name: string;
  description: string;
  price: number;
  max_guests: number;
  quantity: number;
  available_quantity: number;
  final_price: number;
  bookings: Booking[];
  room_unavailabilities: RoomUnavailability[];
  peak_season_rates: PeakSeasonRate[];
  room_pictures: Array<{
    id: number;
    file_path: string | null;
  }>;
}

export interface PropertyDetail {
  property_id: number;
  name: string;
  description: string;
  location: string;
  category: string | null;
  city: {
    name: string;
    type: string;
  } | null;
  property_pictures: Array<{
    id: number;
    file_path: string;
    is_main: boolean;
  }>;
  available_rooms: ProcessedRoom[];
}

export interface CalendarDay {
  date: string;
  day_of_week: string;
  is_available: boolean;
  min_price: number | null;
  available_rooms_count: number;
}

export interface CalendarData {
  property_id: number;
  property_name: string;
  year: number;
  month: number;
  calendar: CalendarDay[];
  pagination: {
    current_month: number;
    current_year: number;
    has_prev_month: boolean;
    has_next_month: boolean;
    prev_month_url: string;
    next_month_url: string;
  };
}

// Interface untuk response API
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface ApiResponseArray<T = any> {
  success: boolean;
  message: string;
  data?: T[];
}

// Interface untuk Prisma where clause umum
export interface PrismaWhereClause {
  [key: string]: any;
}

// Interface untuk pagination
export interface PaginationOptions {
  current_month: number;
  current_year: number;
  has_prev_month: boolean;
  has_next_month: boolean;
  prev_month_url: string;
  next_month_url: string;
}

// Interface untuk kategori
export interface CategoryData {
  id: number;
  name: string;
  properties_count: number;
}

// Interface fleksibel untuk hasil Prisma query
export interface PartialPropertyCategory {
  name: string;
}

export interface PartialCity {
  name: string;
  type: string;
}

export interface PrismaPropertyResult {
  id: number;
  name: string;
  location?: string;
  description?: string;
  city_id?: number | null;
  property_categories?: PartialPropertyCategory | null;
  cities?: PartialCity | null;
  property_pictures: Array<{
    id?: number;
    file_path: string;
    is_main?: boolean | null;
  }>;
  rooms: Array<{
    id: number;
    name: string;
    description: string;
    price: number;
    max_guests: number;
    quantity: number;
    bookings: Booking[];
    room_unavailabilities: RoomUnavailability[];
    peak_season_rates: PeakSeasonRate[];
    room_pictures?: Array<{
      id?: number;
      file_path?: string | null;
      created_at?: Date;
    }>;
  }>;
}

export interface PrismaCalendarResult {
  id: number;
  name: string;
  rooms: Array<{
    id: number;
    name: string;
    price: number;
    quantity: number;
    bookings: Booking[];
    room_unavailabilities: RoomUnavailability[];
    peak_season_rates: PeakSeasonRate[];
  }>;
}

export interface PrismaCategoryResult {
  id: number;
  name: string;
  tenant_id: string | null;
}
