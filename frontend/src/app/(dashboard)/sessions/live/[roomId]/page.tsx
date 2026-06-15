'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  Chat,
} from '@livekit/components-react';
import '@livekit/components-styles';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, BookOpen, Users } from 'lucide-react';

export default function LiveClassPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params?.roomId as string;

  const [token, setToken] = useState('');
  const [serverUrl, setServerUrl] = useState('');

  useEffect(() => {
    if (!roomId) return;
    
    const fetchToken = async () => {
      try {
        const res = await api.post('/live-sessions/token', { roomName: roomId });
        setToken(res.data.token);
        setServerUrl(res.data.serverUrl || 'ws://localhost:7880');
      } catch (e) {
        toast.error('Failed to join room. Are you authorized?');
        router.push('/sessions');
      }
    };
    fetchToken();
  }, [roomId, router]);

  if (!token) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Joining the Live Class...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[85vh] flex flex-col bg-slate-950 rounded-2xl overflow-hidden shadow-2xl relative">
      {/* Student Viewer Header */}
      <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/sessions')} className="text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-white font-bold flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
              Live Class: {roomId}
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            Taking Notes
          </div>
        </div>
      </div>

      {/* Main Viewer Area */}
      <LiveKitRoom
        video={false} // Students default to no video
        audio={false} // Students default to no audio
        token={token}
        serverUrl={serverUrl}
        connect={true}
        data-lk-theme="default"
        style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}
      >
        <div className="flex-1 relative flex flex-col h-full overflow-hidden bg-slate-950">
          <VideoConference />
          <RoomAudioRenderer />
        </div>

        {/* Live Chat Sidebar */}
        <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full shrink-0">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              Live Class Chat
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">Ask questions here. The tutor is monitoring.</p>
          </div>
          <div className="flex-1 relative">
             <Chat />
          </div>
        </div>
      </LiveKitRoom>
    </div>
  );
}
