'use client'

import { User } from 'firebase/auth'
import { FriendRequestWithReceiver, FriendRequestWithRequester } from '@/lib/types/prisma/Friends'
import { useState } from 'react'
import { GradientButton } from '@/app/components/GradientButton'

interface FriendRequestsProps {
  sentRequests: FriendRequestWithReceiver[]
  receivedRequests: FriendRequestWithRequester[]
  onUpdate: () => void
  user: User
}

export default function FriendRequests({ sentRequests, receivedRequests, onUpdate, user }: FriendRequestsProps) {
  const [responding, setResponding] = useState<string | null>(null)
  const [activeSubTab, setActiveSubTab] = useState<'received' | 'sent'>('received')

  const handleRespondToRequest = async (requestId: string, action: 'accept' | 'reject' | 'block') => {
    try {
      setResponding(requestId)
      const userToken = await user.getIdToken()
      
      const response = await fetch('/api/friends/respond', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requestId, action })
      })

      if (!response.ok) {
        throw new Error('Failed to respond to friend request')
      }

      onUpdate() // Refresh the data
    } catch (error) {
      console.error('Error responding to friend request:', error)
      alert('Failed to respond to friend request. Please try again.')
    } finally {
      setResponding(null)
    }
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-400'
      case 'REJECTED': return 'text-red-400'
      case 'BLOCKED': return 'text-red-600'
      default: return 'text-gray-400'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pending'
      case 'REJECTED': return 'Rejected'
      case 'BLOCKED': return 'Blocked'
      default: return status
    }
  }

  const pendingReceived = receivedRequests.filter(req => req.status === 'PENDING')
  const processedReceived = receivedRequests.filter(req => req.status !== 'PENDING')

  return (
    <div>
      {/* Sub-tab Navigation */}
      <div className="flex space-x-1 bg-[var(--color-darker)] rounded-lg p-1 mb-6">
        <button
          onClick={() => setActiveSubTab('received')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
            activeSubTab === 'received'
              ? 'bg-[var(--color-accent)] text-white shadow-lg'
              : 'text-gray-300 hover:text-white hover:bg-[var(--color-dark)]'
          }`}
        >
          Received ({receivedRequests.length})
          {pendingReceived.length > 0 && (
            <span className="ml-2 bg-yellow-500 text-black text-xs rounded-full px-2 py-1">
              {pendingReceived.length} pending
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSubTab('sent')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
            activeSubTab === 'sent'
              ? 'bg-[var(--color-accent)] text-white shadow-lg'
              : 'text-gray-300 hover:text-white hover:bg-[var(--color-dark)]'
          }`}
        >
          Sent ({sentRequests.length})
        </button>
      </div>

      {/* Received Requests Tab */}
      {activeSubTab === 'received' && (
        <div>
          {pendingReceived.length > 0 && (
            <>
              <h3 className="text-lg font-semibold text-white mb-4">
                ⏳ Pending Requests ({pendingReceived.length})
              </h3>
              <div className="grid gap-4 mb-8">
                {pendingReceived.map((request) => (
                  <div
                    key={request.id}
                    className="bg-[var(--color-darker)] rounded-lg p-6 border-l-4 border-yellow-500"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-[var(--color-accent)] rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {request.requester?.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">
                            {request.requester?.displayName}
                          </h4>
                          <p className="text-gray-300 text-sm">
                            {request.requester?.email}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {formatDate(request.requestedAt)}
                          </p>
                          {request.message && (
                            <p className="text-gray-300 text-sm mt-2 italic">
                              "{request.message}"
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <GradientButton
                          size="sm"
                          onClick={() => handleRespondToRequest(request.id, 'accept')}
                          disabled={responding === request.id}
                        >
                          {responding === request.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            '✓ Accept'
                          )}
                        </GradientButton>
                        <GradientButton
                          size="sm"
                          destructive
                          onClick={() => handleRespondToRequest(request.id, 'reject')}
                          disabled={responding === request.id}
                        >
                          ✗ Reject
                        </GradientButton>
                        <GradientButton
                          size="sm"
                          destructive
                          onClick={() => handleRespondToRequest(request.id, 'block')}
                          disabled={responding === request.id}
                          className="px-3"
                        >
                          🚫
                        </GradientButton>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {processedReceived.length > 0 && (
            <>
              <h3 className="text-lg font-semibold text-white mb-4">
                📋 Request History ({processedReceived.length})
              </h3>
              <div className="grid gap-3">
                {processedReceived.map((request) => (
                  <div
                    key={request.id}
                    className="bg-[var(--color-darker)] rounded-lg p-4 opacity-75"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {request.requester?.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-white text-sm">
                            {request.requester?.displayName}
                          </span>
                          <p className="text-gray-400 text-xs">
                            {formatDate(request.requestedAt)}
                          </p>
                        </div>
                      </div>
                      <span className={`text-sm font-medium ${getStatusColor(request.status)}`}>
                        {getStatusText(request.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {receivedRequests.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📭</div>
              <h3 className="text-lg font-semibold text-white mb-2">
                No friend requests received
              </h3>
              <p className="text-gray-300">
                When someone sends you a friend request, it will appear here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Sent Requests Tab */}
      {activeSubTab === 'sent' && (
        <div>
          {sentRequests.length > 0 ? (
            <div className="grid gap-4">
              {sentRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-[var(--color-darker)] rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[var(--color-accent)] rounded-full flex items-center justify-center text-white font-bold">
                        {request.receiver?.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-white font-medium">
                          {request.receiver?.displayName}
                        </h4>
                        <p className="text-gray-300 text-sm">
                          {request.receiver?.email}
                        </p>
                        <p className="text-gray-400 text-xs">
                          Sent {formatDate(request.requestedAt)}
                        </p>
                        {request.respondedAt && (
                          <p className="text-gray-400 text-xs">
                            Responded {formatDate(request.respondedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-medium ${getStatusColor(request.status)}`}>
                        {getStatusText(request.status)}
                      </span>
                      {request.message && (
                        <p className="text-gray-400 text-xs mt-1">
                          Message sent
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📤</div>
              <h3 className="text-lg font-semibold text-white mb-2">
                No friend requests sent
              </h3>
              <p className="text-gray-300">
                Start connecting with people by searching for friends to add!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}