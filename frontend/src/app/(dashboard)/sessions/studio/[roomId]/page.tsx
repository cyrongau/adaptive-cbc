'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  ControlBar,
  useRoomContext,
  useParticipants,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Monitor, PenTool, MessageSquare, Video, Mic, Share, Circle, Users, Settings } from 'lucide-react';

export default function StudioPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params?.roomId as string;

  const [token, setToken] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'video' | 'whiteboard'>('video');
  const [isRecording, setIsRecording] = useState(false);
  const [showQA, setShowQA] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    
    const fetchToken = async () => {
      try {
        const res = await api.post('/live-sessions/token', { roomName: roomId });
        setToken(res.data.token);
        // Using cloud URL if set, otherwise default local
        setServerUrl(res.data.serverUrl || 'ws://localhost:7880');
      } catch (e) {
        toast.error('Failed to join room. Are you authorized?');
        router.push('/sessions');
      }
    };
    fetchToken();
  }, [roomId, router]);

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      toast('Recording stopped.', { icon: '⏹️' });
    } else {
      setIsRecording(true);
      toast.success('Recording started! Auto-deletes in 7 days to save storage.', { duration: 4000 });
    }
  };

  if (!token) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Entering the Studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[85vh] flex flex-col bg-slate-950 rounded-2xl overflow-hidden shadow-2xl relative">
      {/* Studio Header */}
      <div className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/sessions')} className="text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-white font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Live Studio
            </h1>
            <p className="text-xs text-slate-400">Room: {roomId}</p>
          </div>
        </div>
        
        <div className="flex bg-slate-800 rounded-lg p-1">
          <button 
            onClick={() => setActiveTab('video')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition ${activeTab === 'video' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <Monitor className="w-4 h-4" /> AV & Screen
          </button>
          <button 
            onClick={() => setActiveTab('whiteboard')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition ${activeTab === 'whiteboard' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <PenTool className="w-4 h-4" /> Whiteboard
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={toggleRecording}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition ${isRecording ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            <Circle className={`w-4 h-4 ${isRecording ? 'fill-red-500 animate-pulse' : ''}`} />
            {isRecording ? 'Recording...' : 'Record'}
          </button>
          <button onClick={() => setShowQA(!showQA)} className="p-2 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition relative">
            <MessageSquare className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full"></span>
          </button>
        </div>
      </div>

      {/* Main Studio Area */}
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={serverUrl}
        connect={true}
        data-lk-theme="default"
        style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}
      >
        <div className="flex-1 relative flex flex-col h-full overflow-hidden bg-slate-950">
          {activeTab === 'video' ? (
            <div className="flex-1 overflow-hidden relative">
              <VideoConference />
            </div>
          ) : (
            <div className="flex-1 relative bg-white">
              <Tldraw />
              {/* Overlay note for students */}
              <div className="absolute top-4 right-4 bg-slate-900/80 text-white px-3 py-1.5 rounded-lg backdrop-blur-sm text-sm flex items-center gap-2 shadow-lg">
                <PenTool className="w-4 h-4 text-purple-400" />
                Live Whiteboard
              </div>
            </div>
          )}
          
          <RoomAudioRenderer />
        </div>

        {/* Custom Q&A Sidebar */}
        {showQA && (
          <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full shrink-0">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-white font-bold flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                Q&A Moderation
              </h3>
              <UsersCount />
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              <div className="text-center text-slate-500 text-sm mt-10">
                No questions yet.
              </div>
            </div>
            <div className="p-4 border-t border-slate-800">
               <input type="text" placeholder="Send announcement..." className="w-full bg-slate-950 border border-slate-800 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500" />
            </div>
          </div>
        )}
      </LiveKitRoom>
    </div>
  );
}

// Helper component to show participant count
function UsersCount() {
  const participants = useParticipants();
  return (
    <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold bg-slate-950 px-2 py-1 rounded-md">
      <Users className="w-3 h-3" />
      {participants.length}
    </div>
  );
}
