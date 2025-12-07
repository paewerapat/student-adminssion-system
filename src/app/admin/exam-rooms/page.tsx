'use client'

import { useState, useEffect } from 'react'
import { Button, Input, Card, CardContent, Modal, Badge } from '@/components/ui'
import { Plus, Pencil, Trash2, DoorOpen } from 'lucide-react'

interface ExamRoom {
  id: string
  roomNumber: string
  building: string | null
  floor: string | null
  capacity: number
  currentCount: number
  isActive: boolean
  isFull: boolean
  _count: {
    applicants: number
  }
}

export default function ExamRoomsPage() {
  const [rooms, setRooms] = useState<ExamRoom[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<ExamRoom | null>(null)
  const [formData, setFormData] = useState({
    roomNumber: '',
    building: '',
    floor: '',
    capacity: '',
    isActive: true,
  })

  useEffect(() => {
    fetchRooms()
  }, [])

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/admin/exam-rooms')
      const data = await res.json()
      setRooms(data)
    } catch (error) {
      console.error('Error fetching rooms:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenModal = (room?: ExamRoom) => {
    if (room) {
      setEditingRoom(room)
      setFormData({
        roomNumber: room.roomNumber,
        building: room.building || '',
        floor: room.floor || '',
        capacity: room.capacity.toString(),
        isActive: room.isActive,
      })
    } else {
      setEditingRoom(null)
      setFormData({
        roomNumber: '',
        building: '',
        floor: '',
        capacity: '',
        isActive: true,
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingRoom(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingRoom 
        ? `/api/admin/exam-rooms/${editingRoom.id}`
        : '/api/admin/exam-rooms'
      
      const res = await fetch(url, {
        method: editingRoom ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error)
        return
      }

      handleCloseModal()
      fetchRooms()
    } catch (error) {
      console.error('Error saving room:', error)
      alert('เกิดข้อผิดพลาด')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('ต้องการลบห้องสอบนี้?')) return

    try {
      const res = await fetch(`/api/admin/exam-rooms/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error)
        return
      }

      fetchRooms()
    } catch (error) {
      console.error('Error deleting room:', error)
      alert('เกิดข้อผิดพลาด')
    }
  }

  // Group rooms by building
  const groupedRooms = rooms.reduce((acc, room) => {
    const building = room.building || 'ไม่ระบุอาคาร'
    if (!acc[building]) acc[building] = []
    acc[building].push(room)
    return acc
  }, {} as Record<string, ExamRoom[]>)

  // Calculate totals
  const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0)
  const totalAssigned = rooms.reduce((sum, r) => sum + r._count.applicants, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการห้องสอบ</h1>
          <p className="text-gray-500">เพิ่ม แก้ไข ลบ ห้องสอบ</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          เพิ่มห้องสอบ
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{rooms.length}</p>
            <p className="text-sm text-gray-500">ห้องสอบทั้งหมด</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{totalCapacity}</p>
            <p className="text-sm text-gray-500">ความจุรวม</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{totalAssigned}</p>
            <p className="text-sm text-gray-500">จัดที่นั่งแล้ว</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">กำลังโหลด...</div>
      ) : rooms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <DoorOpen className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">ยังไม่มีห้องสอบ</p>
            <Button className="mt-4" onClick={() => handleOpenModal()}>
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มห้องสอบแรก
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedRooms).map(([building, buildingRooms]) => (
            <div key={building}>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">{building}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {buildingRooms.map((room) => {
                  const usagePercent = Math.round((room._count.applicants / room.capacity) * 100)
                  return (
                    <Card key={room.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              ห้อง {room.roomNumber}
                            </h3>
                            {room.floor && (
                              <p className="text-sm text-gray-500">ชั้น {room.floor}</p>
                            )}
                          </div>
                          <Badge variant={room.isActive ? 'success' : 'default'}>
                            {room.isActive ? 'เปิดใช้งาน' : 'ปิด'}
                          </Badge>
                        </div>

                        {/* Capacity bar */}
                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-500">
                              {room._count.applicants} / {room.capacity} คน
                            </span>
                            <span className="text-gray-500">{usagePercent}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                usagePercent >= 100
                                  ? 'bg-red-500'
                                  : usagePercent >= 80
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(usagePercent, 100)}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenModal(room)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(room.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingRoom ? 'แก้ไขห้องสอบ' : 'เพิ่มห้องสอบ'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="roomNumber"
            label="เลขห้อง"
            placeholder="101"
            value={formData.roomNumber}
            onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
            required
          />

          <Input
            id="building"
            label="อาคาร"
            placeholder="อาคาร 1"
            value={formData.building}
            onChange={(e) => setFormData({ ...formData, building: e.target.value })}
          />

          <Input
            id="floor"
            label="ชั้น"
            placeholder="1"
            value={formData.floor}
            onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
          />

          <Input
            id="capacity"
            type="number"
            label="ความจุ (คน)"
            placeholder="30"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
            required
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              เปิดใช้งาน
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={handleCloseModal}>
              ยกเลิก
            </Button>
            <Button type="submit">
              {editingRoom ? 'บันทึก' : 'เพิ่มห้องสอบ'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
