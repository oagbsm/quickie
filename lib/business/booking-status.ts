export const BOOKING_STATUSES = ["requested","under_review","awaiting_customer_confirmation","confirmed","provider_assigned","on_the_way","arrived","in_progress","completed","cancelled","unable_to_fulfil"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
type StatusConfig={customerLabel:string;adminLabel:string;customerCopy:string;tone:"neutral"|"warning"|"success"|"danger";order:number};
export const bookingStatusConfig:Record<BookingStatus,StatusConfig>={
 requested:{customerLabel:"Request received",adminLabel:"Requested",customerCopy:"Quickola has received your request and will review the appointment details.",tone:"neutral",order:1},
 under_review:{customerLabel:"Under review",adminLabel:"Under review",customerCopy:"Quickola is reviewing your requested appointment and price.",tone:"warning",order:2},
 awaiting_customer_confirmation:{customerLabel:"Price approval needed",adminLabel:"Awaiting customer",customerCopy:"A price change needs your approval before this appointment can be confirmed.",tone:"warning",order:3},
 confirmed:{customerLabel:"Appointment confirmed",adminLabel:"Confirmed · unassigned",customerCopy:"Your cleaning appointment is confirmed. Quickola is managing the service.",tone:"success",order:4},
 provider_assigned:{customerLabel:"Cleaning team assigned",adminLabel:"Provider assigned",customerCopy:"A cleaning team has been assigned to your appointment.",tone:"success",order:5},
 on_the_way:{customerLabel:"Cleaner on the way",adminLabel:"On the way",customerCopy:"Your cleaner is travelling to the property.",tone:"warning",order:6},
 arrived:{customerLabel:"Cleaner arrived",adminLabel:"Arrived",customerCopy:"Your cleaner has arrived at the property.",tone:"warning",order:7},
 in_progress:{customerLabel:"Clean in progress",adminLabel:"In progress",customerCopy:"The clean is now in progress.",tone:"warning",order:8},
 completed:{customerLabel:"Clean completed",adminLabel:"Completed",customerCopy:"The clean has been completed.",tone:"success",order:9},
 cancelled:{customerLabel:"Cancelled",adminLabel:"Cancelled",customerCopy:"This booking has been cancelled.",tone:"danger",order:10},
 unable_to_fulfil:{customerLabel:"Unable to fulfil",adminLabel:"Unable to fulfil",customerCopy:"Quickola was unable to fulfil this request. Please contact us if you need help.",tone:"danger",order:11},
};
export const allowedBookingTransitions:Record<BookingStatus,readonly BookingStatus[]>={
 requested:["under_review","confirmed","cancelled","unable_to_fulfil"],under_review:["confirmed","cancelled","unable_to_fulfil"],awaiting_customer_confirmation:["cancelled","unable_to_fulfil"],confirmed:["cancelled","unable_to_fulfil"],provider_assigned:["on_the_way","confirmed","cancelled","unable_to_fulfil"],on_the_way:["arrived","cancelled","unable_to_fulfil"],arrived:["in_progress","cancelled","unable_to_fulfil"],in_progress:["completed","cancelled"],completed:[],cancelled:[],unable_to_fulfil:[]};
export const customerActionStatuses:readonly BookingStatus[]=["awaiting_customer_confirmation"];
export const activeBookingStatuses:readonly BookingStatus[]=["requested","under_review","awaiting_customer_confirmation","confirmed","provider_assigned","on_the_way","arrived","in_progress"];
export function isBookingStatus(value:string):value is BookingStatus{return BOOKING_STATUSES.includes(value as BookingStatus)}
export function canTransitionBooking(from:BookingStatus,to:BookingStatus){return allowedBookingTransitions[from].includes(to)}
export function getBookingStatus(value:string){return isBookingStatus(value)?bookingStatusConfig[value]:bookingStatusConfig.requested}
export function needsCustomerAction(value:string){return value==="awaiting_customer_confirmation"}
