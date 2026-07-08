import { FiEye, FiTrash2 } from "react-icons/fi";
import { Memory } from "../lib/api";
import { formatDate } from "../lib/utils";

interface Props {
  memories: Memory[];
  onView: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function MemoryTable({ memories, onView, onDelete }: Props) {
  return (
    <div className="memory-table">
      <div className="memory-table-header">
        <span>Content</span>
        <span>ID</span>
        <span>Created</span>
        <span>Actions</span>
      </div>
      {memories.map((m) => (
        <div key={m.id} className="memory-table-row">
          <span className="content">{m.content}</span>
          <span className="id">{m.id.slice(0, 8)}…</span>
          <span className="date">{formatDate(m.created_at)}</span>
          <span className="actions">
            <button onClick={() => onView(m.id)} title="View" className="btn-secondary btn-sm"><FiEye size={14} /></button>
            <button onClick={() => onDelete(m.id)} title="Delete" className="btn-danger btn-sm"><FiTrash2 size={14} /></button>
          </span>
        </div>
      ))}
    </div>
  );
}
