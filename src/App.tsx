import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, AlertCircle, ArrowRight, ArrowUpRight, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, Circle, Command, FileText, FolderKanban, LayoutDashboard, ListTodo, LoaderCircle, Menu, MoreHorizontal, Plus, Search, Settings, Sparkles, Target, TrendingUp, X } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import personalProjectCharacter from './assets/personal-project-character.png';
import dashboardHero from './assets/dashboard-hero.png';

type Status='Planned'|'In Progress'|'On Hold'|'Completed'; type Priority='Low'|'Medium'|'High'|'Urgent'; type TaskStatus='To Do'|'In Progress'|'In Review'|'Done';
type Project={id:number;name:string;description:string;category:string;technology:string;status:Status;priority:Priority;startDate?:string;deadline?:string;owner?:string;notes?:string;usefulLinks?:string;repositoryUrl?:string;progress:number;taskCount?:number;milestoneCount?:number;completedTasks?:number};
type Task={id:number;title:string;description?:string;projectId:number;projectName?:string;status:TaskStatus;priority:Priority;dueDate?:string;assignee?:string;tags?:string[];updatedAt?:string};
type Milestone={id:number;name:string;description?:string;projectId:number;projectName?:string;targetDate?:string;status:string};
type ActivityItem={id:number;action:string;entityType:string;entityName:string;details?:string;createdAt:string};
type WorkspaceMetrics={total:number;active:number;completed:number;pending:number;upcoming:number;overdue:number};
const api=axios.create({baseURL:import.meta.env.VITE_API_URL||'http://localhost:8080/api',timeout:8000});
const nav=[['Dashboard',LayoutDashboard],['Projects',FolderKanban],['Tasks',ListTodo],['Calendar',CalendarDays],['Activity Log',Activity],['Settings',Settings]] as const;
const colors=['#81df28','#26ba7b','#a2c75a','#46d0a3'];
function fmtDate(date?:string){if(!date)return 'No deadline'; return new Intl.DateTimeFormat('en',{month:'short',day:'numeric'}).format(new Date(`${date}T00:00:00`));}
function App(){
 const [page,setPage]=useState('Dashboard'),[projects,setProjects]=useState<Project[]>([]),[tasks,setTasks]=useState<Task[]>([]),[milestones,setMilestones]=useState<Milestone[]>([]),[activities,setActivities]=useState<ActivityItem[]>([]),[metrics,setMetrics]=useState<WorkspaceMetrics>({total:0,active:0,completed:0,pending:0,upcoming:0,overdue:0}),[loading,setLoading]=useState(true),[error,setError]=useState(''),[toast,setToast]=useState(''),[modal,setModal]=useState<'project'|'task'|'update'|null>(null),[menu,setMenu]=useState(false),[search,setSearch]=useState(''),[calendar,setCalendar]=useState(new Date()),[filter,setFilter]=useState('All projects');
 const reload=async()=>{setLoading(true);setError('');try{const [p,t,m,a,s]=await Promise.all([api.get('/projects'),api.get('/tasks?limit=500'),api.get('/milestones'),api.get('/activity?limit=200'),api.get('/dashboard')]);setProjects(p.data);setTasks(t.data);setMilestones(m.data);setActivities(a.data);setMetrics(s.data);}catch{setError('The API is unavailable. Start the Spring Boot server and PostgreSQL, then refresh to load workspace data.');}finally{setLoading(false);}};
 useEffect(()=>{void reload()},[]);useEffect(()=>{if(toast){const t=window.setTimeout(()=>setToast(''),3200);return()=>clearTimeout(t)}},[toast]);
 const today=new Date(),weekAhead=new Date();today.setHours(0,0,0,0);weekAhead.setDate(weekAhead.getDate()+7);const localDate=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;const todayKey=localDate(today),weekKey=localDate(weekAhead);const dueSoon=tasks.filter(t=>t.status!=='Done'&&t.dueDate&&t.dueDate>=todayKey&&t.dueDate<=weekKey).sort((a,b)=>(a.dueDate||'').localeCompare(b.dueDate||'')).slice(0,4);const high=tasks.filter(t=>(t.priority==='High'||t.priority==='Urgent')&&t.status!=='Done').slice(0,3);
 const mutate=async(kind:'project'|'task'|'update',data:unknown,id?:number)=>{const url=kind==='update'?'/daily-updates':`/${kind==='project'?'projects':'tasks'}${id?`/${id}`:''}`;if(kind==='task'&&id) await api.put(url,data);else if(kind==='project'&&id)await api.put(url,data);else await api.post(url,data);await reload();setModal(null);setToast(kind==='update'?'Progress note saved':`${kind==='project'?'Project':'Task'} saved successfully`)};
 const changeStatus=async(t:Task,status:TaskStatus)=>{try{await api.patch(`/tasks/${t.id}/status`,{status});await reload();setToast('Task status updated')}catch{setToast('Could not update task. Please try again.')}};
 const removeProject=async(p:Project)=>{const count=p.taskCount||0,milestones=p.milestoneCount||0;if(!window.confirm(`Delete “${p.name}” and its ${count} related task(s) and ${milestones} milestone(s)? This cannot be undone.`))return;try{await api.delete(`/projects/${p.id}`);await reload();setToast('Project deleted')}catch{setToast('Could not delete project. Please try again.')}};
 return (
  <div className="app dark">
    <aside className={`sidebar ${menu ? 'open' : ''}`}>
      <div className="brand">
        <div className="brandmark"><Command size={19}/></div>
        <div><strong>tamzode</strong><span>TECHNOLOGY</span></div>
        <button className="mobile-close icon-button" onClick={()=>setMenu(false)} aria-label="Close navigation"><X size={18}/></button>
      </div>
      <div className="nav-label">WORKSPACE</div>
      <nav>
        {nav.map(([name, Icon]) => (
          <button
            key={name}
            className={`nav-item ${page === name ? 'selected' : ''}`}
            onClick={() => { setPage(name); setMenu(false); }}
          >
            <Icon size={18}/>
            <span>{name}</span>
            {name === 'Tasks' && metrics.pending > 0 && <i>{metrics.pending}</i>}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="upgrade">
          <div className="upgrade-icon"><Sparkles size={16}/></div>
          <b>Keep your momentum</b>
          <p>Your projects are ready for their next chapter.</p>
          <button onClick={()=>setModal('update')}>Add a daily update <ArrowRight size={14}/></button>
        </div>
        <button className="profile">
          <div className="avatar">TZ</div>
          <span><b>My Workspace</b><small>Personal tracker</small></span>
          <MoreHorizontal size={18}/>
        </button>
      </div>
    </aside>
    <main className="main">
      <header className="topbar">
        <button className="icon-button mobile-menu" onClick={()=>setMenu(true)} aria-label="Open navigation"><Menu size={20}/></button>
        <div className="breadcrumbs">Workspace <span>/</span> <b>{page}</b></div>
        <div className="top-actions">
          <label className="search">
            <Search size={16}/>
            <input placeholder="Search anything..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </label>
          <div className="avatar top-avatar">TZ</div>
        </div>
      </header>
 <div className="content"><AnimatePresence mode="wait"><motion.div key={page} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-4}} transition={{duration:.18}}>
 {loading?<div className="loading"><LoaderCircle className="spin" size={22}/>Connecting to your workspace...</div>:error?<Unavailable retry={reload}/>:page==='Dashboard'?<Dashboard projects={projects} activities={activities} metrics={metrics} dueSoon={dueSoon} high={high} onTask={()=>setModal('task')} onUpdate={()=>setModal('update')} onProject={()=>setModal('project')} onPage={setPage} changeStatus={changeStatus}/>:page==='Projects'?<Projects projects={projects.filter(p=>p.name.toLowerCase().includes(search.toLowerCase()))} onCreate={()=>setModal('project')} onDelete={removeProject}/>:page==='Tasks'?<Tasks tasks={tasks.filter(t=>t.title.toLowerCase().includes(search.toLowerCase())&&(filter==='All projects'||t.projectName===filter))} projects={projects} filter={filter} setFilter={setFilter} onCreate={()=>setModal('task')} changeStatus={changeStatus}/>:page==='Calendar'?<Calendar tasks={tasks} milestones={milestones} projects={projects} date={calendar} setDate={setCalendar}/>:page==='Activity Log'?<ActivityPage items={activities}/>:<SettingsPage api={!!error} projects={projects.length} tasks={tasks.length}/>}
 </motion.div></AnimatePresence></div></main>
  {menu&&<button className="scrim" onClick={()=>setMenu(false)} aria-label="Close navigation"/>}{modal&&<Modal kind={modal} projects={projects} close={()=>setModal(null)} save={mutate}/>}<AnimatePresence>{toast&&<motion.div className="toast" initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} exit={{opacity:0,y:8}}><CheckCircle2 size={18}/>{toast}</motion.div>}</AnimatePresence>
  </div>
  );
}
function Header({eyebrow,title,description,actions}:{eyebrow:string;title:string;description:string;actions?:React.ReactNode}){return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{actions&&<div className="heading-actions">{actions}</div>}</div>}
function Unavailable({retry}:{retry:()=>void}){return <div className="unavailable"><div className="unavailable-main"><div className="unavailable-art"><img src={personalProjectCharacter} alt="Illustration of a person working on a laptop"/><span className="connection-dot"/></div><div className="unavailable-copy"><span className="eyebrow">WORKSPACE CONNECTION</span><h2>Your workspace is out of reach</h2><p>The tracker is open, but it can’t read your project data yet. Start the API and confirm its PostgreSQL connection, then try again.</p><div className="unavailable-actions"><span className="connection-pill"><i/>API not connected</span><button className="button primary" onClick={retry}>Try again <ArrowRight size={15}/></button></div></div></div><div className="unavailable-steps"><div className="unavailable-steps-head"><b>Two quick checks</b><span>To get back to work</span></div><div className="unavailable-step"><i>01</i><span><b>Start the backend</b><small>Make sure the Spring Boot API is running.</small></span></div><div className="unavailable-step"><i>02</i><span><b>Check the database connection</b><small>Confirm the PostgreSQL URL and credentials.</small></span></div></div></div>}
function Dashboard({projects,activities,metrics,dueSoon,high,onTask,onUpdate,onProject,onPage,changeStatus}:{projects:Project[];activities:ActivityItem[];metrics:WorkspaceMetrics;dueSoon:Task[];high:Task[];onTask:()=>void;onUpdate:()=>void;onProject:()=>void;onPage:(p:string)=>void;changeStatus:(t:Task,s:TaskStatus)=>void}){
 const hour=new Date().getHours(),greeting=hour<12?'Good morning':hour<17?'Good afternoon':'Good evening';
 const featuredProject=projects.find(p=>p.status==='In Progress')||projects.find(p=>p.status==='Planned')||projects.find(p=>p.status==='On Hold')||projects[0];
 const otherProjects=projects.filter(p=>p.id!==featuredProject?.id).slice(0,3);
 const taskTotal=metrics.completed+metrics.pending;
 const metricCards:any[]=[[FolderKanban,'Total projects',metrics.total,'Across your workspace','teal',null],[TrendingUp,'In progress',metrics.active,'Moving forward now','green',metrics.total?metrics.active/metrics.total*100:null],[CheckCircle2,'Tasks completed',metrics.completed,'Marked done','blue',taskTotal?metrics.completed/taskTotal*100:null],[ListTodo,'Pending tasks',metrics.pending,'Still on your list','purple',taskTotal?metrics.pending/taskTotal*100:null],[CalendarDays,'Upcoming deadlines',metrics.upcoming,'Due in the next 7 days','green',null],[AlertCircle,'Overdue tasks',metrics.overdue,'Past due and unfinished','orange',null]];
 return <><Header eyebrow={new Intl.DateTimeFormat(undefined,{weekday:'long',month:'long',day:'numeric'}).format(new Date()).toUpperCase()} title={greeting} description="Your projects, tasks, and milestones at a glance." actions={<><button className="button secondary" onClick={onTask}><Plus size={16}/> Add task</button><button className="button primary" onClick={onProject}><Plus size={16}/> New project</button></>}/>
 <section className="personal-banner"><div className="personal-banner-copy"><span className="eyebrow">YOUR PERSONAL WORKSPACE</span><h2>Your ideas, in motion.</h2><p>Choose a clear next step and keep your projects moving forward.</p></div><img src={dashboardHero} alt="Developer working on project tracker workspace"/></section>
 <div className="metric-grid">{metricCards.map(([I,label,val,hint,color,ratio]:any)=><div className={`metric-card ${ratio!==null?'has-progress':''}`} key={label}><div className="metric-top"><span>{label}</span><div className={`metric-icon ${color}`}><I size={17}/></div></div><div className="metric-value">{loadingNumber(val)}</div><div className="metric-hint"><span className={`dot ${color}`}/>{hint}</div>{ratio!==null&&<div className="metric-progress" aria-label={`${Math.round(ratio)} percent`}><span style={{width:`${Math.max(0,Math.min(100,ratio))}%`}}/></div>}</div>)}</div>
 <section className="section projects-section">{featuredProject?<><FeaturedProject p={featuredProject} onBrowse={()=>onPage('Projects')}/>{otherProjects.length>0&&<><div className="section-head more-projects-head"><div><h2>More projects</h2><p>Your other work in progress</p></div><button className="text-button" onClick={()=>onPage('Projects')}>All projects <ArrowRight size={15}/></button></div><div className="project-grid">{otherProjects.map((p,i)=><ProjectCard key={p.id} p={p} color={colors[(i+1)%4]}/>)}</div></>}</>:<Empty title="Your next project starts here" body="Create a project to give your ideas a clear plan and a place to grow." action="Create project" onClick={onProject}/>}</section>
 <div className="lower-grid"><section className="panel"><div className="section-head"><div><h2>Upcoming deadlines</h2><p>What’s coming up next</p></div><button className="icon-button" aria-label="View calendar" onClick={()=>onPage('Calendar')}><ArrowUpRight size={17}/></button></div>{dueSoon.length?<div className="deadline-list">{dueSoon.map(t=><div className="deadline-row" key={t.id}><button className="task-check" onClick={()=>changeStatus(t,'Done')} aria-label={`Complete ${t.title}`}><Circle size={19}/></button><div className="deadline-copy"><b>{t.title}</b><small>{t.projectName||'Project'}</small></div><span className="date-pill"><CalendarDays size={13}/>{fmtDate(t.dueDate)}</span></div>)}</div>:<Empty title="Nothing due soon" body="Tasks with a deadline will show up here."/>}</section>
 <section className="panel"><div className="section-head"><div><h2>Priority focus</h2><p>Tasks that need attention</p></div><span className="priority-count">{high.length} {high.length===1?'task':'tasks'}</span></div>{high.length?<div className="focus-list">{high.map(t=><div className="focus-row" key={t.id}><span className={`priority-dot ${t.priority.toLowerCase()}`}/><div><b>{t.title}</b><small>{t.projectName||'Personal task'} · {t.status}</small></div><span className={`priority-badge ${t.priority.toLowerCase()}`}>{t.priority}</span><button className="icon-button" onClick={()=>changeStatus(t,t.status==='Done'?'To Do':'Done')} aria-label="Complete task"><Check size={15}/></button></div>)}</div>:<Empty title="All clear" body="High and urgent priority tasks will appear here."/>}</section>
 <section className="panel activity-panel"><div className="section-head"><div><h2>Recent activity</h2><p>A little progress goes a long way</p></div><button className="text-button" onClick={()=>onPage('Activity Log')}>View all <ArrowRight size={15}/></button></div>{activities.length?<div className="activity-list">{activities.slice(0,4).map(a=><ActivityRow key={a.id} item={a}/>)}</div>:<Empty title="Your story starts here" body="Project and task updates will appear as you work."/>}</section>
 <section className="note-card"><div className="note-icon"><FileText size={17}/></div><span className="eyebrow">A MOMENT TO REFLECT</span><h3>Capture today’s progress</h3><p>Log what you worked on, what’s next, and anything in your way.</p><button className="button note-button" onClick={onUpdate}>Write a daily note <Plus size={15}/></button></section></div>
 </>}
function loadingNumber(v:number){return v.toString()}
function FeaturedProject({p,onBrowse}:{p:Project;onBrowse:()=>void}){const progress=Math.max(0,Math.min(100,p.progress||0));return <article className="featured-project"><div className="featured-project-copy"><div className="featured-project-meta"><span className="eyebrow">YOUR CURRENT FOCUS</span><span className={`status-badge ${p.status.toLowerCase().replace(' ','-')}`}><i/>{p.status}</span></div><h2>{p.name}</h2><p>{p.description||p.category||'Keep this project moving one step at a time.'}</p><div className="featured-project-details"><span><CalendarDays size={15}/>{p.deadline?`Due ${fmtDate(p.deadline)}`:'No deadline set'}</span><span><ListTodo size={15}/>{p.completedTasks||0} of {p.taskCount||0} tasks complete</span></div><button className="text-button" onClick={onBrowse}>View all projects <ArrowRight size={15}/></button></div><div className="featured-progress-ring" style={{'--progress':`${progress}%`} as React.CSSProperties} role="img" aria-label={`${progress}% complete`}><div><b>{progress}%</b><small>complete</small></div></div></article>}
function ProjectCard({p,color,onDelete}:{p:Project;color:string;onDelete?:()=>void}){
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <article className="project-card">
      <div className="project-card-top">
        <div className="project-symbol" style={{'--project-color':color} as React.CSSProperties}>
          <FolderKanban size={18}/>
        </div>
        <span className={`status-badge ${p.status.toLowerCase().replace(' ','-')}`}>
          <i/>{p.status}
        </span>
        {onDelete ? (
          <div className="project-menu-wrap">
            <button
              className="icon-button tiny"
              aria-label="More project options"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <MoreHorizontal size={17}/>
            </button>
            {menuOpen && (
              <div className="project-dropdown-menu">
                <button
                  className="dropdown-item danger"
                  onClick={() => { setMenuOpen(false); onDelete(); }}
                >
                  Delete project
                </button>
              </div>
            )}
          </div>
        ) : (
          <button className="icon-button tiny" aria-label="More project options">
            <MoreHorizontal size={17}/>
          </button>
        )}
      </div>
      <h3>{p.name}</h3>
      <p className="project-desc">{p.description||p.category}</p>
      <div className="progress-label">
        <span>Progress</span>
        <b>{p.progress}%</b>
      </div>
      <div className="progress-track">
        <div style={{width:`${p.progress}%`,background:color}}/>
      </div>
      <div className="project-card-foot">
        <span><ListTodo size={14}/>{p.completedTasks||0}/{p.taskCount||0} tasks</span>
        <span className="priority-label"><i className={`priority-dot ${p.priority.toLowerCase()}`}/>{p.priority} priority</span>
      </div>
    </article>
  );
}
function Projects({projects,onCreate,onDelete}:{projects:Project[];onCreate:()=>void;onDelete:(p:Project)=>void}){
  const [q,setQ]=useState(''),[status,setStatus]=useState('All statuses'),[view,setView]=useState('grid');
  const filtered=projects.filter(p=>p.name.toLowerCase().includes(q.toLowerCase())&&(status==='All statuses'||p.status===status));
  return (
    <>
      <Header
        eyebrow="YOUR WORKSPACE"
        title="Projects"
        description={`${projects.length} ${projects.length===1?'project':'projects'} keeping things moving.`}
        actions={<button className="button primary" onClick={onCreate}><Plus size={16}/> New project</button>}
      />
      <div className="toolbar">
        <label className="search inline-search">
          <Search size={16}/>
          <input placeholder="Find a project..." value={q} onChange={e=>setQ(e.target.value)}/>
        </label>
        <div className="toolbar-right">
          <select value={status} onChange={e=>setStatus(e.target.value)}>
            <option>All statuses</option>
            <option>Planned</option>
            <option>In Progress</option>
            <option>On Hold</option>
            <option>Completed</option>
          </select>
          <div className="view-toggle">
            <button onClick={()=>setView('grid')} className={view==='grid'?'active':''}>Grid</button>
            <button onClick={()=>setView('list')} className={view==='list'?'active':''}>List</button>
          </div>
        </div>
      </div>
      {filtered.length ? (
        <div className={view==='grid'?'project-grid projects-page-grid':'project-list'}>
          {filtered.map((p,i)=>(
            <ProjectCard key={p.id} p={p} color={colors[i%4]} onDelete={()=>onDelete(p)}/>
          ))}
        </div>
      ) : (
        <Empty
          title="No projects found"
          body={projects.length?'Try a different search or status filter.':'Create a project to see it here.'}
          action="Create project"
          onClick={onCreate}
        />
      )}
    </>
  );
}
function Tasks({tasks,projects,filter,setFilter,onCreate,changeStatus}:{tasks:Task[];projects:Project[];filter:string;setFilter:(s:string)=>void;onCreate:()=>void;changeStatus:(t:Task,s:TaskStatus)=>void}){const[view,setView]=useState<'list'|'board'>('list'),[status,setStatus]=useState('All statuses');const filtered=tasks.filter(t=>status==='All statuses'||t.status===status);return <><Header eyebrow="GET THINGS DONE" title="Tasks" description="The small steps that move big things forward." actions={<button className="button primary" onClick={onCreate}><Plus size={16}/> Add task</button>}/><div className="toolbar"><div className="toolbar-right"><select value={filter} onChange={e=>setFilter(e.target.value)}><option>All projects</option>{projects.map(p=><option key={p.id}>{p.name}</option>)}</select><select value={status} onChange={e=>setStatus(e.target.value)}><option>All statuses</option>{['To Do','In Progress','In Review','Done'].map(s=><option key={s}>{s}</option>)}</select></div><div className="view-toggle"><button className={view==='list'?'active':''} onClick={()=>setView('list')}>List</button><button className={view==='board'?'active':''} onClick={()=>setView('board')}>Board</button></div></div>{view==='list'?filtered.length?<div className="task-table"><div className="task-table-head"><span>Task</span><span>Project</span><span>Priority</span><span>Due date</span><span>Status</span></div>{filtered.map(t=><div className="task-table-row" key={t.id}><button className="check-btn" onClick={()=>changeStatus(t,t.status==='Done'?'To Do':'Done')} aria-label="Toggle task completion">{t.status==='Done'?<CheckCircle2 size={19}/>:<Circle size={19}/>}</button><b>{t.title}</b><span className="task-project">{t.projectName}</span><span className="priority-label"><i className={`priority-dot ${t.priority.toLowerCase()}`}/>{t.priority}</span><span className="task-date">{fmtDate(t.dueDate)}</span><select className="status-select" value={t.status} onChange={e=>changeStatus(t,e.target.value as TaskStatus)}>{['To Do','In Progress','In Review','Done'].map(s=><option key={s}>{s}</option>)}</select></div>)}</div>:<Empty title="No tasks here yet" body="Add a task and give your project its next step." action="Add task" onClick={onCreate}/>:<div className="board">{(['To Do','In Progress','In Review','Done'] as TaskStatus[]).map((s,i)=><div className="board-col" key={s}><div className="board-title"><span className={`kanban-dot dot-${i}`}/><b>{s}</b><i>{filtered.filter(t=>t.status===s).length}</i></div>{filtered.filter(t=>t.status===s).map(t=><article className="kanban-card" key={t.id}><b>{t.title}</b><small>{t.projectName}</small><div><span className={`priority-dot ${t.priority.toLowerCase()}`}/>{t.priority}<button onClick={()=>changeStatus(t,(['To Do','In Progress','In Review','Done'] as TaskStatus[])[Math.min(i+1,3)])} aria-label="Move task forward"><ArrowRight size={14}/></button></div></article>)}<button className="add-board-task" onClick={onCreate}><Plus size={14}/> Add task</button></div>)}</div>}</>}
function Calendar({tasks,milestones,projects,date,setDate}:{tasks:Task[];milestones:Milestone[];projects:Project[];date:Date;setDate:(d:Date)=>void}){const year=date.getFullYear(),month=date.getMonth(),start=new Date(year,month,1),days=new Date(year,month+1,0).getDate(),offset=(start.getDay()+6)%7,cells=Math.ceil((offset+days)/7)*7;return <><Header eyebrow="PLAN AHEAD" title="Calendar" description="Deadlines and milestones, all in one place." actions={<button className="button secondary" onClick={()=>setDate(new Date())}>Today</button>}/><div className="calendar-panel"><div className="calendar-toolbar"><div className="calendar-month"><button className="icon-button" onClick={()=>setDate(new Date(year,month-1,1))}><ChevronLeft size={18}/></button><h2>{date.toLocaleString('en',{month:'long',year:'numeric'})}</h2><button className="icon-button" onClick={()=>setDate(new Date(year,month+1,1))}><ChevronRight size={18}/></button></div><span className="calendar-legend"><i/>Task deadline <span className="milestone-legend"/>Milestone</span></div><div className="calendar-grid">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=><div className="weekday" key={d}>{d}</div>)}{Array.from({length:cells},(_,i)=>{const day=i-offset+1,valid=day>0&&day<=days,dt=valid?`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`:'',items=tasks.filter(t=>t.dueDate===dt),targets=milestones.filter(m=>m.targetDate===dt);return <div key={i} className={`calendar-cell ${valid?'':'muted'} ${valid&&new Date(year,month,day).toDateString()===new Date().toDateString()?'today':''}`}><span className="calendar-day">{valid?day:new Date(year,month,day).getDate()}</span>{items.slice(0,2).map(t=><span key={`t${t.id}`} className={`calendar-event ${t.status==='Done'?'done':''}`} title={t.title}>{t.title}</span>)}{targets.slice(0,2).map(m=><span key={`m${m.id}`} className="calendar-event milestone-event" title={m.name}>{m.name}</span>)}{items.length+targets.length>2&&<small>+{items.length+targets.length-2} more</small>}</div>})}</div></div><section className="section calendar-upcoming"><div className="section-head"><div><h2>Month at a glance</h2><p>{tasks.filter(t=>t.dueDate?.startsWith(`${year}-${String(month+1).padStart(2,'0')}`)).length} task deadlines · {milestones.filter(m=>m.targetDate?.startsWith(`${year}-${String(month+1).padStart(2,'0')}`)).length} milestones · {projects.length} projects</p></div></div></section></>}
function ActivityPage({items}:{items:ActivityItem[]}){return <><Header eyebrow="THE JOURNEY SO FAR" title="Activity log" description="Every meaningful step, captured along the way."/><div className="activity-timeline">{items.length?items.map(a=><ActivityRow key={a.id} item={a} large/>):<Empty title="A fresh beginning" body="Updates to projects, tasks, and milestones will be recorded here."/>}</div></>}
function ActivityRow({item,large=false}:{item:ActivityItem;large?:boolean}){return <div className={`activity-row ${large?'large':''}`}><div className="activity-icon"><Activity size={15}/></div><div className="activity-copy"><b>{item.action} <span>{item.entityName}</span></b>{item.details&&<small>{item.details}</small>}<time>{new Date(item.createdAt).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'})}</time></div></div>}
function SettingsPage({api:offline,projects,tasks}:{api:boolean;projects:number;tasks:number}){return <><Header eyebrow="MAKE IT YOURS" title="Settings" description="A few details about your workspace."/><div className="settings-layout"><section className="panel settings-card"><div className="settings-head"><div className="settings-icon"><Command size={19}/></div><div><h2>Workspace preferences</h2><p>How your tracker looks and feels</p></div></div><div className="setting-row"><div><b>Workspace theme</b><small>One consistent look across your tracker</small></div><span className="readonly theme-label">Deep green · Electric lime</span></div><div className="setting-row"><div><b>Workspace name</b><small>The name shown across your tracker</small></div><span className="readonly">Tamzode Technology</span></div><div className="setting-row"><div><b>Product</b><small>Your team’s project workspace</small></div><span className="readonly">Tamzode Project Tracker</span></div></section><section className="panel settings-card"><div className="settings-head"><div className="settings-icon green"><Activity size={19}/></div><div><h2>Data & connection</h2><p>Live connection to your project workspace</p></div></div><div className="setting-row"><div><b>API connection</b><small>Spring Boot REST API · PostgreSQL</small></div><span className={`connection ${offline?'offline':''}`}><i/>{offline?'Disconnected':'Connected'}</span></div><div className="setting-row"><div><b>Stored records</b><small>Projects and tasks in your workspace</small></div><span className="readonly">{projects} projects · {tasks} tasks</span></div></section><div className="settings-foot"><AlertCircle size={15}/> Workspace data is stored in your configured PostgreSQL database.</div></div></>}
function Empty({title,body,action,onClick}:{title:string;body:string;action?:string;onClick?:()=>void}){return <div className="empty"><div className="empty-icon"><Target size={20}/></div><b>{title}</b><p>{body}</p>{action&&onClick&&<button className="button secondary" onClick={onClick}><Plus size={15}/>{action}</button>}</div>}
const taskSchema=z.object({title:z.string().trim().min(2,'Give this task a name.'),description:z.string().optional(),projectId:z.number().positive('Choose a project.'),priority:z.enum(['Low','Medium','High','Urgent']),status:z.enum(['To Do','In Progress','In Review','Done']),dueDate:z.string().optional(),assignee:z.string().optional()});
const projectSchema=z.object({name:z.string().trim().min(2,'Enter a project name.'),description:z.string().optional(),category:z.string().optional(),technology:z.string().optional(),status:z.enum(['Planned','In Progress','On Hold','Completed']),priority:z.enum(['Low','Medium','High','Urgent']),startDate:z.string().optional(),deadline:z.string().optional(),owner:z.string().optional()});
function Modal({kind,projects,close,save}:{kind:'project'|'task'|'update';projects:Project[];close:()=>void;save:(kind:'project'|'task'|'update',data:unknown,id?:number)=>Promise<void>}){const [saving,setSaving]=useState(false),isTask=kind==='task',isProject=kind==='project';const taskForm=useForm<z.infer<typeof taskSchema>>({resolver:zodResolver(taskSchema),defaultValues:{status:'To Do',priority:'Medium',projectId:projects[0]?.id}});const projectForm=useForm<z.infer<typeof projectSchema>>({resolver:zodResolver(projectSchema),defaultValues:{status:'Planned',priority:'Medium'}});const updateForm=useForm({defaultValues:{workedOn:'',completed:'',blockers:'',nextSteps:''}});const submit=async(data:any)=>{setSaving(true);try{await save(kind,data)}catch{alert('The server could not save this change. Please check your connection and try again.')}finally{setSaving(false)}};const title=isTask?'Add a task':isProject?'Create a project':'Daily progress note';return <div className="modal-overlay" onMouseDown={e=>e.target===e.currentTarget&&close()}><motion.div className="modal" initial={{opacity:0,y:14,scale:.98}} animate={{opacity:1,y:0,scale:1}}><div className="modal-header"><div><span className="eyebrow">{isTask?'NEXT SMALL STEP':isProject?'NEW BEGINNING':'DAILY REFLECTION'}</span><h2>{title}</h2></div><button className="icon-button" onClick={close} aria-label="Close dialog"><X size={19}/></button></div>{isTask?<form onSubmit={taskForm.handleSubmit(submit)}><Field label="Task title" error={taskForm.formState.errors.title?.message}><input autoFocus placeholder="e.g. Draft the homepage wireframe" {...taskForm.register('title')}/></Field><Field label="Description"><textarea placeholder="Add a little context (optional)" {...taskForm.register('description')}/></Field><div className="form-row"><Field label="Project" error={taskForm.formState.errors.projectId?.message}><select {...taskForm.register('projectId',{valueAsNumber:true})}><option value="">Choose project</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></Field><Field label="Priority"><select {...taskForm.register('priority')}>{['Low','Medium','High','Urgent'].map(x=><option key={x}>{x}</option>)}</select></Field></div><div className="form-row"><Field label="Due date"><input type="date" {...taskForm.register('dueDate')}/></Field><Field label="Assignee"><input placeholder="Optional" {...taskForm.register('assignee')}/></Field></div>{!projects.length&&<div className="form-warning">Create a project before adding a task.</div>}<FormButtons close={close} saving={saving} disabled={!projects.length}/></form>:isProject?<form onSubmit={projectForm.handleSubmit(submit)}><Field label="Project name" error={projectForm.formState.errors.name?.message}><input autoFocus placeholder="What are you working on?" {...projectForm.register('name')}/></Field><Field label="Description"><textarea placeholder="What does success look like?" {...projectForm.register('description')}/></Field><div className="form-row"><Field label="Category"><input placeholder="e.g. Client project" {...projectForm.register('category')}/></Field><Field label="Technology stack"><input placeholder="e.g. React, PostgreSQL" {...projectForm.register('technology')}/></Field></div><div className="form-row"><Field label="Status"><select {...projectForm.register('status')}>{['Planned','In Progress','On Hold','Completed'].map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Priority"><select {...projectForm.register('priority')}>{['Low','Medium','High','Urgent'].map(x=><option key={x}>{x}</option>)}</select></Field></div><div className="form-row"><Field label="Start date"><input type="date" {...projectForm.register('startDate')}/></Field><Field label="Deadline"><input type="date" {...projectForm.register('deadline')}/></Field></div><Field label="Owner"><input placeholder="Optional" {...projectForm.register('owner')}/></Field><FormButtons close={close} saving={saving}/></form>:<form onSubmit={updateForm.handleSubmit(submit)}><p className="form-intro">A short note keeps the whole journey in view.</p><Field label="What did you work on?"><textarea autoFocus placeholder="The focus of your day..." {...updateForm.register('workedOn',{required:true})}/></Field><Field label="What did you complete?"><textarea placeholder="Small wins count too" {...updateForm.register('completed')}/></Field><Field label="Blockers"><textarea placeholder="Anything slowing you down?" {...updateForm.register('blockers')}/></Field><Field label="Next steps"><textarea placeholder="What comes next?" {...updateForm.register('nextSteps')}/></Field><FormButtons close={close} saving={saving}/></form>}</motion.div></div>}
function Field({label,error,children}:{label:string;error?:string;children:React.ReactNode}){return <label className="field"><span>{label}</span>{children}{error&&<small className="field-error">{error}</small>}</label>}
function FormButtons({close,saving,disabled=false}:{close:()=>void;saving:boolean;disabled?:boolean}){return <div className="form-actions"><button type="button" className="button secondary" onClick={close}>Cancel</button><button className="button primary" type="submit" disabled={saving||disabled}>{saving?<><LoaderCircle size={15} className="spin"/>Saving...</>:<><Check size={15}/>Save</>}</button></div>}

export default App;
