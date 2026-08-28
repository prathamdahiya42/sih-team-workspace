'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, Copy, Check, Shield, Award, Edit3, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { PRESET_CUSTOM_ROLES, TeamMember } from '@/lib/types';

interface TeamMembersListProps {
  team: {
    id: string;
    name: string;
    invite_code: string;
  };
  members: TeamMember[];
  currentUserId?: string;
  onMemberRoleUpdate?: (userId: string, newRole: string | null) => void;
}

export function TeamMembersList({ team, members, currentUserId, onMemberRoleUpdate }: TeamMembersListProps) {
  const [memberList, setMemberList] = useState<TeamMember[]>(members);
  const [copiedCode, setCopiedCode] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [customInputMap, setCustomInputMap] = useState<Record<string, string>>({});
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync state if props change
  React.useEffect(() => {
    setMemberList(members);
  }, [members]);

  const memberCount = memberList.length;
  const maxCap = 9;
  const isFull = memberCount >= maxCap;

  // Check if viewing user is team owner
  const isOwner = memberList.some((m) => m.user_id === currentUserId && m.role === 'owner');

  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(team.invite_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleUpdateRole = async (userId: string, newRole: string | null) => {
    const previousRole = memberList.find((m) => m.user_id === userId)?.custom_role;

    // Optimistic UI update
    setMemberList((prev) =>
      prev.map((m) => (m.user_id === userId ? { ...m, custom_role: newRole } : m))
    );
    if (onMemberRoleUpdate) {
      onMemberRoleUpdate(userId, newRole);
    }
    setEditingUserId(null);

    try {
      setUpdatingUserId(userId);
      const res = await fetch(`/api/teams/${team.id}/members/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custom_role: newRole }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update member role');
      }

      setToastMessage({
        type: 'success',
        text: `Role ${newRole ? `"${newRole}"` : 'cleared'} assigned successfully!`,
      });
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err: any) {
      // Revert on error
      setMemberList((prev) =>
        prev.map((m) => (m.user_id === userId ? { ...m, custom_role: previousRole } : m))
      );
      setToastMessage({ type: 'error', text: err.message || 'Failed to save role' });
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sihgreen-50 text-sihgreen-600 border border-sihgreen-200">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <CardTitle>Team Roster & Roles</CardTitle>
              <CardDescription>
                {isOwner
                  ? 'As Team Lead, you can assign specialized SIH roles (e.g. ML Lead, Frontend Lead) to members.'
                  : 'SIH team members and their specialized project roles.'}
              </CardDescription>
            </div>
          </div>

          <Badge variant={isFull ? 'danger' : 'green'} className="text-xs px-3 py-1">
            {memberCount} / {maxCap} Members {isFull ? '(Max Cap Reached)' : '(Slots Open)'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {toastMessage && (
          <div
            className={`flex items-center justify-between p-3 rounded-xl text-xs font-medium ${
              toastMessage.type === 'success'
                ? 'bg-sihgreen-50 text-sihgreen-800 border border-sihgreen-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMessage.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-sihgreen-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <span>{toastMessage.text}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="font-bold px-1 text-slate-400 hover:text-slate-700">
              ✕
            </button>
          </div>
        )}

        {/* Invite Code Box */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-saffron-50/60 border border-saffron-200">
          <div>
            <span className="text-xs font-bold text-saffron-900 block">Team Invite Code</span>
            <span className="text-[11px] text-saffron-700">Share this code with your teammates to let them join:</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-bold bg-white px-3 py-1 rounded-lg border border-saffron-300 text-saffron-900 tracking-wider">
              {team.invite_code}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyInviteCode}
              className="bg-white border-saffron-300 text-saffron-800 hover:bg-saffron-100"
            >
              {copiedCode ? <Check className="h-3.5 w-3.5 text-sihgreen-600 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
              {copiedCode ? 'Copied' : 'Copy Code'}
            </Button>
          </div>
        </div>

        {/* Member Capacity Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-slate-700">
            <span>SIH Team Size Target: 6 to 9 Members</span>
            <span>{Math.round((memberCount / maxCap) * 100)}%</span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                memberCount >= 6 ? 'bg-sihgreen-500' : 'bg-saffron-500'
              }`}
              style={{ width: `${(memberCount / maxCap) * 100}%` }}
            />
          </div>
        </div>

        {/* Member List */}
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
          {memberList.map((member) => {
            const name = member.profile?.full_name || member.profile?.email?.split('@')[0] || 'Teammate';
            const email = member.profile?.email || '—';
            const isSelf = member.user_id === currentUserId;
            const isEditing = editingUserId === member.user_id;
            const isCustomRolePreset = member.custom_role && PRESET_CUSTOM_ROLES.includes(member.custom_role as any);

            return (
              <div
                key={member.user_id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-white hover:bg-slate-50 transition gap-3"
              >
                {/* Left: User Identity & Badges */}
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-50 text-navy-800 font-bold text-xs border border-navy-200">
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{name}</span>
                      {isSelf && <span className="text-[10px] text-slate-400 font-semibold">(You)</span>}
                      
                      {/* Permissions badge */}
                      <Badge variant={member.role === 'owner' ? 'saffron' : 'outline'} className="text-[10px] py-0">
                        {member.role === 'owner' ? 'Team Lead' : 'Member'}
                      </Badge>

                      {/* Read-only Custom Role Badge (when not editing) */}
                      {!isEditing && member.custom_role && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-navy-50 px-2 py-0.5 text-[10px] font-semibold text-navy-700 border border-navy-200">
                          <Award className="h-3 w-3 text-navy-500" />
                          {member.custom_role}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">{email}</span>
                  </div>
                </div>

                {/* Right: Custom Role Selector (Owner) or Info (Member) */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {isOwner ? (
                    <div className="flex items-center gap-1.5">
                      {isEditing ? (
                        /* Custom typed-in role form */
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const val = customInputMap[member.user_id] ?? '';
                            handleUpdateRole(member.user_id, val.trim() || null);
                          }}
                          className="flex items-center gap-1.5"
                        >
                          <input
                            type="text"
                            placeholder="Type custom role..."
                            value={customInputMap[member.user_id] ?? (member.custom_role || '')}
                            onChange={(e) =>
                              setCustomInputMap((prev) => ({
                                ...prev,
                                [member.user_id]: e.target.value,
                              }))
                            }
                            className="h-7 w-36 px-2 text-xs rounded-lg border border-saffron-400 bg-white focus:outline-none focus:ring-1 focus:ring-saffron-500"
                            autoFocus
                          />
                          <Button
                            type="submit"
                            size="sm"
                            variant="primary"
                            className="h-7 px-2 text-[11px]"
                            disabled={updatingUserId === member.user_id}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingUserId(null)}
                            className="h-7 px-1.5 text-slate-400 hover:text-slate-700"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </form>
                      ) : (
                        /* Role Dropdown Selector */
                        <div className="flex items-center gap-1.5">
                          <select
                            value={
                              !member.custom_role
                                ? ''
                                : isCustomRolePreset
                                ? member.custom_role
                                : '__custom__'
                            }
                            disabled={updatingUserId === member.user_id}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '__custom__') {
                                setCustomInputMap((prev) => ({
                                  ...prev,
                                  [member.user_id]: member.custom_role || '',
                                }));
                                setEditingUserId(member.user_id);
                              } else {
                                handleUpdateRole(member.user_id, val || null);
                              }
                            }}
                            className="h-7 px-2 text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium focus:border-saffron-500 focus:outline-none cursor-pointer transition"
                          >
                            <option value="">No Role Assigned</option>
                            <optgroup label="Preset Roles">
                              {PRESET_CUSTOM_ROLES.map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label="Other">
                              <option value="__custom__">
                                {!isCustomRolePreset && member.custom_role
                                  ? `Custom: ${member.custom_role}`
                                  : '✏️ Custom Role...'}
                              </option>
                            </optgroup>
                          </select>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {member.joined_at && (
                    <span className="text-[10px] text-slate-400 hidden lg:inline">
                      Joined {formatDate(member.joined_at)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

