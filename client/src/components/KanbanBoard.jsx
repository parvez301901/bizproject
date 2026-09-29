import React from 'react';
import { 
  Plus, 
  Calendar, 
  Clock, 
  AlertCircle, 
  MoreVertical,
  ChevronRight
} from 'lucide-react';

const COLUMNS = [
  { id: 'Backlog', title: 'Backlog', accent: 'border-slate-300', countBg: 'bg-slate-100 text-slate-700' },
  { id: 'To Do', title: 'To Do', accent: 'border-amber-400', countBg: 'bg-amber-100 text-amber-800' },
  { id: 'In Progress', title: 'In Progress', accent: 'border-emerald-500', countBg: 'bg-emerald-100 text-emerald-800' },
  { id: 'In Review', title: 'In Review', accent: 'border-blue-400', countBg: 'bg-blue-100 text-blue-800' },
  { id: 'Done', title: 'Done', accent: 'border-emerald-600', countBg: 'bg-emerald-200 text-emerald-900' }
];

const PRIORITY_BADGES = {
  'Low': 'bg-slate-100 text-slate-600',
  'Medium': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'High': 'bg-amber-50 text-amber-700 border border-amber-200',
  'Urgent': 'bg-rose-50 text-rose-700 border border-rose-200'
};

export default function KanbanBoard({ tasks = [], users = [], onUpdateTask, onOpenTaskModal, onAddTask }) {
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onUpdateTask(taskId, { status: targetStatus });
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 pt-1 items-start min-h-[600px]">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter(t => t.status === col.id);

        return (
          <div
            key={col.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
            className="w-80 shrink-0 bg-slate-50/70 border border-slate-200/80 rounded-2xl flex flex-col max-h-[82vh]"
          >
            {/* Column Header */}
            <div className={`p-3.5 border-b border-slate-200/70 flex items-center justify-between border-t-4 ${col.accent} rounded-t-2xl bg-white`}>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">{col.title}</h3>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${col.countBg}`}>
                  {colTasks.length}
                </span>
              </div>
              <button
                onClick={() => onAddTask({ status: col.id, title: 'New Task', priority: 'Medium' })}
                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-emerald-600 transition-colors"
                title="Add task in this column"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Tasks Container */}
            <div className="p-2.5 overflow-y-auto space-y-2.5 flex-1">
              {colTasks.length === 0 ? (
                <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                  Drop items here
                </div>
              ) : (
                colTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onClick={() => onOpenTaskModal(task)}
                    className="p-3.5 bg-white border border-slate-200/80 hover:border-emerald-300 rounded-xl shadow-xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing space-y-3 group"
                  >
                    {/* Tags & Priority & XP */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${PRIORITY_BADGES[task.priority] || PRIORITY_BADGES['Medium']}`}>
                          {task.priority}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80">
                          +{task.xp_reward || 50} XP
                        </span>
                      </div>
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex gap-1 overflow-hidden">
                          {task.tags.slice(0, 2).map((tag, idx) => (
                            <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Task Title */}
                    <h4 className="text-xs font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-relaxed">
                      {task.title}
                    </h4>

                    {/* Meta Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                      <div className="flex items-center gap-2">
                        {task.due_date && (
                          <span className="flex items-center gap-1 text-slate-500">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {task.due_date}
                          </span>
                        )}
                        {task.estimated_hours > 0 && (
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {task.estimated_hours}h
                          </span>
                        )}
                      </div>

                      {/* Assignees */}
                      <div className="flex items-center -space-x-1.5">
                        {task.assignee_ids && task.assignee_ids.map(uid => {
                          const user = users.find(u => u.id === uid);
                          return (
                            <img
                              key={uid}
                              src={user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`}
                              title={user?.full_name}
                              alt=""
                              className="w-5 h-5 rounded-full border border-white object-cover"
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
