'use client';

import { useMemo, useState, useTransition } from 'react';
import { setUserRole } from '@/lib/actions/settings';

type Row = { id: string; name: string; studentId: string; role: 'student' | 'teacher' | 'admin'; info: string };

export function RoleManager({ users }: { users: Row[] }) {
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState(users);
  const [error, setError] = useState<string>();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, start] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim();
    return q ? rows.filter((r) => r.name.includes(q) || r.studentId.includes(q)) : rows;
  }, [rows, query]);

  function change(id: string, role: 'student' | 'teacher') {
    setError(undefined);
    setPendingId(id);
    start(async () => {
      const res = await setUserRole(id, role);
      if (res?.error) setError(res.error);
      else setRows((prev) => prev.map((r) => (r.id === id ? { ...r, role } : r)));
      setPendingId(null);
    });
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">사용자 역할 관리</h3>
      <label htmlFor="role-search" className="sr-only">이름 또는 학번 검색</label>
      <input id="role-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="이름 또는 학번 검색" className="input" />
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <ul className="max-h-80 divide-y divide-line overflow-y-auto rounded-lg border border-line">
        {filtered.map((r) => (
          <li key={r.id} className="flex items-center gap-3 px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{r.name}</p>
              <p className="text-xs tabular-nums text-muted">
                {r.studentId} {r.info && `(${r.info})`}
              </p>
            </div>
            {r.role === 'admin' ? (
              <span className="chip">관리자</span>
            ) : (
              <>
                <label htmlFor={`role-${r.id}`} className="sr-only">{r.name} 역할</label>
                <select
                  id={`role-${r.id}`}
                  value={r.role}
                  disabled={pendingId === r.id}
                  onChange={(e) => change(r.id, e.target.value as 'student' | 'teacher')}
                  className="input h-8 w-24 px-2 text-xs"
                >
                  <option value="student">학생</option>
                  <option value="teacher">교사</option>
                </select>
              </>
            )}
          </li>
        ))}
        {filtered.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">검색 결과가 없습니다.</li>}
      </ul>
    </div>
  );
}
