export type DashboardBooking = {
  id: string;
  scheduled_start: string;
  status: string;
  properties: { nickname: string } | { nickname: string }[] | null;
};

export function createDashboardViewModel<
  Booking extends DashboardBooking,
  Activity,
  Property,
>(input: {
  accountId: string;
  userId: string;
  displayName: string;
  propertyCount: number;
  upcomingCount: number;
  completedCount: number;
  actionRequiredCount: number;
  upcomingBookings: Booking[];
  recentActivity: Activity[];
  properties: Property[];
  monthSummary: { completed: number; upcoming: number; cancelled: number };
}) {
  return {
    accountId: input.accountId,
    userId: input.userId,
    displayName: input.displayName,
    counts: {
      properties: input.propertyCount,
      upcoming: input.upcomingCount,
      completed: input.completedCount,
      actionRequired: input.actionRequiredCount,
    },
    nextBooking: input.upcomingBookings[0] ?? null,
    remainingUpcoming: input.upcomingBookings.slice(1),
    recentActivity: input.recentActivity,
    properties: input.properties,
    monthSummary: input.monthSummary,
  };
}
