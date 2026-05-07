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
  userId: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  ndisNumber?: string;
  supportNeeds?: string;
  status: 'active' | 'inactive' | 'pending' | 'exited';
  moveInDate?: string;
  moveOutDate?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  notes?: string;
}

export interface Property {
  id: string;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  propertyType: 'house' | 'apartment' | 'unit' | 'townhouse' | 'studio';
  bedrooms: number;
  bathrooms: number;
  capacity: number;
  status: 'available' | 'occupied' | 'maintenance' | 'inactive';
  monthlyRent?: number;
  description?: string;
  currentOccupants?: number;
}

export interface Allocation {
  id: string;
  clientId: string;
  propertyId: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'ended' | 'pending';
  notes?: string;
  address?: string;
  suburb?: string;
  state?: string;
  propertyType?: string;
}

export type TicketCategory = 'maintenance' | 'financial' | 'support' | 'complaint' | 'general' | 'emergency';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'pending_client' | 'resolved' | 'closed';

export interface Ticket {
  id: string;
  clientId: string;
  assignedTo?: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  clientName?: string;
  clientEmail?: string;
  assignedToName?: string;
  messages?: TicketMessage[];
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  message: string;
  isInternal: boolean;
  createdAt: string;
  senderName?: string;
  senderRole?: string;
}

export type ReportType = 'case_note' | 'incident' | 'progress' | 'assessment' | 'exit' | 'other';

export interface Report {
  id: string;
  createdBy: string;
  clientId?: string;
  title: string;
  content: string;
  reportType: ReportType;
  isConfidential: boolean;
  createdAt: string;
  updatedAt: string;
  createdByName?: string;
  clientName?: string;
}

export interface DashboardStats {
  activeClients: number;
  availableProperties: number;
  activeTickets: number;
  openTickets: number;
  recentTickets: Ticket[];
}
