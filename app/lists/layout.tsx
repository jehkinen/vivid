/** Lists load data from DB; skip static prerender so `next build` works without a live database (e.g. CI). */
export const dynamic = 'force-dynamic'

export default function ListsLayout({ children }: { children: React.ReactNode }) {
  return children
}
