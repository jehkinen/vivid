'use client'

import { useState } from 'react'
import SearchDialog from '@/components/search/SearchDialog'

export default function HeaderSearch() {
  const [open, setOpen] = useState(false)
  return <SearchDialog variant="public" open={open} onOpenChange={setOpen} showTrigger /> 
}
