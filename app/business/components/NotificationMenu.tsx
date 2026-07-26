import Link from "next/link";
import { markAllNotificationsRead, markNotificationRead } from "../str-actions";

type Notification = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

export default function NotificationMenu({ notifications }: { notifications: Notification[] }) {
  const unread = notifications.filter((item) => !item.read_at).length;
  return <details className="group relative">
    <summary className="relative grid h-11 w-11 cursor-pointer list-none place-items-center rounded-lg border border-white/15 text-white/80 outline-none hover:bg-white/10 focus-visible:ring-4 focus-visible:ring-blue-300/30" aria-label={`${unread} unread notifications`}>
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>
      {unread > 0 && <span className="absolute right-1 top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-extrabold text-white">{unread > 9 ? "9+" : unread}</span>}
    </summary>
    <div className="fixed inset-x-3 top-16 z-50 max-h-[70vh] overflow-y-auto rounded-xl border bg-white p-2 text-[#071638] shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-13 sm:w-[360px]">
      <div className="flex items-center justify-between px-3 py-2"><h2 className="font-extrabold">Notifications</h2>{unread > 0 && <form action={markAllNotificationsRead}><button className="min-h-9 text-xs font-bold text-[#245b9d]">Mark all read</button></form>}</div>
      <div className="divide-y">{notifications.length ? notifications.map(item => <article key={item.id} className={`p-3 ${item.read_at ? "" : "bg-blue-50/60"}`}><Link href={item.href || "/business/dashboard"} className="block rounded-md outline-none focus-visible:ring-4 focus-visible:ring-[#2d67b2]/20"><div className="flex items-start justify-between gap-3"><h3 className="text-sm font-extrabold">{item.title}</h3>{!item.read_at && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" aria-label="Unread"/>}</div><p className="mt-1 text-sm leading-5 text-[#59677d]">{item.body}</p><time className="mt-2 block text-xs font-semibold text-[#59677d]">{new Intl.DateTimeFormat("en-GB",{dateStyle:"medium",timeStyle:"short"}).format(new Date(item.created_at))}</time></Link>{!item.read_at && <form action={markNotificationRead} className="mt-1 text-right"><button name="notificationId" value={item.id} className="min-h-9 px-2 text-xs font-bold text-[#245b9d]">Mark read</button></form>}</article>) : <p className="p-5 text-center text-sm text-[#59677d]">No notifications yet.</p>}</div>
    </div>
  </details>;
}
