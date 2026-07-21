export const BOOKING_STATUSES = ["requested","under_review","confirmed","assigned","in_progress","completed","cancelled"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export const bookingStatusConfig:Record<BookingStatus,{customerLabel:string;adminLabel:string;customerCopy:string;tone:"neutral"|"warning"|"success"|"danger";order:number}>={
 requested:{customerLabel:"Request received",adminLabel:"Requested",customerCopy:"Quickola is confirming cleaner availability.",tone:"neutral",order:1},
 under_review:{customerLabel:"Reviewing availability",adminLabel:"Under review",customerCopy:"We will confirm your final price and availability before work begins.",tone:"warning",order:2},
 confirmed:{customerLabel:"Confirmed",adminLabel:"Confirmed",customerCopy:"Your price and service time are confirmed. A cleaner is being arranged.",tone:"success",order:3},
 assigned:{customerLabel:"Cleaner assigned",adminLabel:"Assigned",customerCopy:"A cleaner has been assigned to your booking.",tone:"success",order:4},
 in_progress:{customerLabel:"Clean in progress",adminLabel:"In progress",customerCopy:"Your cleaner has checked in and the clean is underway.",tone:"warning",order:5},
 completed:{customerLabel:"Property ready",adminLabel:"Completed",customerCopy:"The clean is complete and your completion report is ready.",tone:"success",order:6},
 cancelled:{customerLabel:"Cancelled",adminLabel:"Cancelled",customerCopy:"This booking has been cancelled.",tone:"danger",order:7},
};
export const allowedBookingTransitions:Record<BookingStatus,readonly BookingStatus[]>={requested:["under_review","confirmed","cancelled"],under_review:["confirmed","cancelled"],confirmed:["assigned","cancelled"],assigned:["in_progress","confirmed","cancelled"],in_progress:["completed","cancelled"],completed:[],cancelled:[]};
export function isBookingStatus(value:string):value is BookingStatus{return BOOKING_STATUSES.includes(value as BookingStatus)}
export function canTransitionBooking(from:BookingStatus,to:BookingStatus){return allowedBookingTransitions[from].includes(to)}
export function getBookingStatus(value:string){return isBookingStatus(value)?bookingStatusConfig[value]:bookingStatusConfig.requested}
