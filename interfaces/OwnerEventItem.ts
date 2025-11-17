export interface OwnerEventItem {
  id: string | number;
  eventName?: string;
  imageUrl?: string | null;
  date?: string;
  timeRange?: string;
  status?: string; // legacy status
  statusCode?: number;
  statusLabel?: string;
}

export default OwnerEventItem;
