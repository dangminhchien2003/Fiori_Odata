export interface LeaveRequestItem {
  CreatedAt: Date;
  Reason: string;
  RequestId: string;
  CreatedBy: string;
  EmployeeId: string;
  LeaveType: string;
  StartDate: string;
  EndDate: string;
  Status: string;
  TimeSlot: string;
}

export interface FieldValueHelpItem {
  FieldKey: string;
  FieldName: string;
  FieldValue: string;
}
