import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Sidebar from "@/components/layout/Sidebar"
import Header from "@/components/layout/Header"

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  // Check the server-side session
  const session = await getServerSession(authOptions)

  if (!session) {
    // No session → redirect to /login
    redirect("/login")
  }

  return (
    <div className='h-screen flex overflow-hidden'>
      <Sidebar />
      <main className='flex-1 flex flex-col md:ml-64 h-full overflow-hidden'>
        <Header />
        <div className='flex-1 overflow-y-auto p-6 md:p-8 custom-scroll'>
          {children}
        </div>
      </main>
    </div>
  )
}
