export interface User {
  id: string;
  email: string;
  role: 'admin' | 'client';
  firstName: string;
  lastName: string;
  client?: Client;
}

export interface Client {
  id: string;
  user_id: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  nhs_number?: string;
  support_needs?: string;
  status: 'active' | 'inactive' | 'pending' | 'exited';
  move_in_date?: string;
  move_out_date?: string;
  address_line1?: string;
  town_city?: string;
  county?: string;
  postcode?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  notes?: string;
}

export interface Property {
  id: string;
  address: string;
  town_city: string;
  county?: string;
  postcode: string;
  property_type: string;
  propertyType?: string;
  bedrooms: number;
  bathrooms: number;
  capacity: number;
  status: 'available' | 'occupied' | 'maintenance' | 'inactive';
  monthly_rent?: number;
  monthlyRent?: number;
  description?: string;
  currentOccupants?: number;
}

export interface Allocation {
  id: string;
  client_id: string;
  property_id: string;
  start_date: string;
  end_date?: string;
  status: 'active' | 'ended' | 'pending';
  notes?: string;
  address?: string;
  town_city?: string;
  county?: string;
  postcode?: string;
  property_type?: string;
}

export type TicketCategory = 'maintenance' | 'financial' | 'support' | 'complaint' | 'general' | 'emergency';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'pending_client' | 'resolved' | 'closed';

export interface Ticket {
  id: string;
  client_id?: string;
  assigned_to?: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  client_name?: string;
  client_email?: string;
  assigned_to_name?: string;
  messages?: TicketMessage[];
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  is_internal: boolean;
  created_at: string;
  sender_name?: string;
  sender_role?: string;
}

export type ReportType = 'case_note' | 'incident' | 'progress' | 'assessment' | 'exit' | 'other';

export interface Report {
  id: string;
  created_by: string;
  client_id?: string;
  title: string;
  content: string;
  report_type: ReportType;
  is_confidential: boolean;
  created_at: string;
  updated_at?: string;
  created_by_name?: string;
  client_name?: string;
}

export interface DashboardStats {
  activeClients: number;
  availableProperties: number;
  activeTickets: number;
  openTickets: number;
  recentTickets: Ticket[];
}
