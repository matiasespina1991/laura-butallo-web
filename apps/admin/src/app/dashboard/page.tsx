"use client";

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  ChevronDown,
  Grid3x3,
  Images,
  LayoutDashboard,
  Layers,
  Search,
  Settings,
  UploadCloud,
  Wand2,
} from 'lucide-react';

const navSections = [
  {
    title: 'General',
    links: [
      { label: 'Overview', icon: LayoutDashboard },
      { label: 'Media Uploads', icon: UploadCloud },
      { label: 'Media Sets', icon: Layers },
    ],
  },
  {
    title: 'Content',
    links: [
      { label: 'Gallery', icon: Images },
      { label: 'Collections', icon: Grid3x3 },
      { label: 'Settings', icon: Settings },
    ],
  },
];

const metricCards = [
  {
    title: 'Nuevos leads',
    value: '4,682',
    delta: '+12.4%',
    since: 'vs última semana',
    trend: 'up',
  },
  {
    title: 'Proyectos activos',
    value: '26',
    delta: '-8.1%',
    since: 'vs último mes',
    trend: 'down',
  },
  {
    title: 'Solicitudes de prensa',
    value: '18',
    delta: '+6.3%',
    since: 'vs último trimestre',
    trend: 'up',
  },
  {
    title: 'Obras destacadas',
    value: '9',
    delta: '+20.1%',
    since: 'curadas esta semana',
    trend: 'up',
  },
];

const uploadQueue = [
  { title: 'Neo Botanical 07', size: '28 MB · 4K', status: 72 },
  { title: 'Morphosis Bloom', size: '18 MB · 3K', status: 41 },
  { title: 'Sonar Bloom', size: '11 MB · 2K', status: 12 },
];

const organizerSlots = [
  { title: 'Aire Floral', status: 'Publicado' },
  { title: 'Futuris Bloom', status: 'Pendiente' },
  { title: 'Astro Botánica', status: 'Publicado' },
  { title: 'Ethereal Bloom', status: 'Borrador' },
  { title: 'Terrarium 2040', status: 'Publicado' },
  { title: 'Cultivos Digitales', status: 'Revisión' },
];

const workflow = [
  {
    title: 'Curaduría principal',
    description: 'Seleccionar nuevas piezas hero',
    owner: 'Laura',
    progress: 78,
  },
  {
    title: 'Series inmersivas',
    description: 'Ordenar clips para la grilla 360º',
    owner: 'Studio',
    progress: 52,
  },
  {
    title: 'Notas y textos',
    description: 'Copys para nuevas exhibiciones',
    owner: 'Copy Lab',
    progress: 34,
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="hidden w-72 flex-none border-r border-slate-200/80 bg-white/80 px-6 py-8 backdrop-blur-lg lg:flex lg:flex-col">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-lg">
            LB Studio
          </div>
          <Badge variant="muted">Admin</Badge>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Gestioná el portfolio, organizá nuevas piezas y planificá qué se publica
          en la home.
        </p>
        <Separator className="my-6" />
        <nav className="flex flex-1 flex-col gap-8">
          {navSections.map((section) => (
            <div key={section.title}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                {section.title}
              </p>
              <div className="space-y-1.5">
                {section.links.map((link, index) => {
                  const Icon = link.icon;
                  const active = index === 0 && section.title === 'General';
                  return (
                    <button
                      key={link.label}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition',
                        active
                          ? 'bg-slate-900 text-white shadow-md'
                          : 'text-slate-500 hover:bg-slate-100'
                      )}
                    >
                      <Icon className="size-4" />
                      {link.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="mt-auto space-y-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-xl">
            <p className="text-sm font-semibold">¿Nueva colección?</p>
            <p className="text-xs text-white/70">
              Prepara la rejilla y define el orden de cada pieza antes de publicarla.
            </p>
            <Button variant="secondary" className="w-full bg-white text-slate-900">
              Crear set curado
            </Button>
          </div>
        </nav>
      </aside>
      <div className="flex flex-1 flex-col bg-slate-50">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 backdrop-blur">
          <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <div className="flex flex-1 items-center gap-3 rounded-2xl bg-slate-100 px-4 py-2">
              <Search className="size-4 text-slate-400" />
              <Input
                placeholder="Buscar obra, colección o tag…"
                className="border-none bg-transparent p-0 focus-visible:ring-0"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" className="gap-2 text-sm text-muted-foreground">
                <Calendar className="size-4" />
                Esta semana
                <ChevronDown className="size-4" />
              </Button>
              <Button variant="default" className="gap-2">
                <Wand2 className="size-4" />
                Automatizar
              </Button>
              <Avatar initials="LB" />
            </div>
          </div>
        </header>
        <main className="flex-1 space-y-6 px-4 py-8 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="muted">Dashboard</Badge>
                <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Beta
                </span>
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                Estado creativo general
              </h1>
              <p className="text-sm text-muted-foreground">
                Métricas del sitio, progreso de uploads y organización editorial.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="rounded-xl border-slate-300 bg-white">
                Exportar reporte
              </Button>
              <Button className="rounded-xl bg-slate-900 hover:bg-slate-800">
                Subir nueva pieza
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="workflow">Workflow</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {metricCards.map((metric) => (
                  <Card key={metric.title}>
                    <CardHeader className="space-y-1">
                      <CardDescription>{metric.title}</CardDescription>
                      <CardTitle className="text-3xl">{metric.value}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
                      {metric.trend === 'up' ? (
                        <ArrowUpRight className="size-4 text-emerald-500" />
                      ) : (
                        <ArrowDownRight className="size-4 text-rose-500" />
                      )}
                      <span
                        className={cn(
                          'font-medium',
                          metric.trend === 'up' ? 'text-emerald-600' : 'text-rose-500'
                        )}
                      >
                        {metric.delta}
                      </span>
                      <span>{metric.since}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="mt-6 grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Actividad del sitio</CardTitle>
                      <CardDescription>
                        Últimos 30 días · visitantes, clicks y guardados
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                      Ver detalles
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-700 p-6 text-white shadow-inner">
                      <p className="text-sm text-white/70">Engagement</p>
                      <div className="mt-4 flex items-baseline gap-3">
                        <span className="text-4xl font-semibold">68%</span>
                        <Badge variant="success">+18% WoW</Badge>
                      </div>
                      <p className="mt-8 text-xs uppercase tracking-[0.4em] text-white/60">
                        Heatmap
                      </p>
                      <div className="mt-3 grid grid-cols-12 gap-1">
                        {Array.from({ length: 36 }).map((_, idx) => (
                          <span
                            key={idx}
                            className="h-2 w-full rounded-full bg-white/10"
                            style={{ opacity: 0.35 + (idx % 6) * 0.08 }}
                          />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Cola de uploads</CardTitle>
                    <CardDescription>Pendiente de procesar</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {uploadQueue.map((item) => (
                      <div key={item.title}>
                        <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                          <p>{item.title}</p>
                          <span className="text-xs text-muted-foreground">{item.size}</span>
                        </div>
                        <Progress value={item.status} />
                      </div>
                    ))}
                  </CardContent>
                  <CardFooter>
                    <Button size="sm" variant="ghost" className="text-xs text-muted-foreground">
                      Revisar carpeta de renders
                    </Button>
                  </CardFooter>
                </Card>
              </div>
              <div className="mt-6 grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Organizador visual</CardTitle>
                      <CardDescription>
                        Arrastra para definir el orden de la grilla en la home.
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      Guardar orden
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-3">
                      {organizerSlots.map((slot, index) => (
                        <div
                          key={slot.title}
                          className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100"
                        >
                          <div className="aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-indigo-200 via-slate-200 to-slate-300" />
                          <div className="mt-3 flex items-center justify-between text-sm font-medium">
                            <p>{slot.title}</p>
                            <Badge
                              variant={
                                slot.status === 'Publicado'
                                  ? 'success'
                                  : slot.status === 'Borrador'
                                    ? 'outline'
                                    : 'muted'
                              }
                              className="text-xs"
                            >
                              {slot.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">Bloque #{index + 1}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Subidas multimedia</CardTitle>
                    <CardDescription>Dropzone creativo</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white/70 p-6 text-center">
                      <UploadCloud className="mx-auto size-8 text-slate-400" />
                      <p className="mt-3 text-sm font-medium text-slate-700">
                        Arrastrá los renders aquí
                      </p>
                      <p className="text-xs text-muted-foreground">JPG, PNG, MP4, WEBM</p>
                      <Button size="sm" className="mt-4 rounded-full">
                        Seleccionar archivos
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                        Últimos registros
                      </p>
                      {uploadQueue.map((item) => (
                        <div
                          key={`${item.title}-recent`}
                          className="flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2 text-sm"
                        >
                          <span>{item.title}</span>
                          <span className="text-xs text-muted-foreground">{item.size}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="analytics">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Fuentes de tráfico</CardTitle>
                    <CardDescription>Top referers & ubicaciones</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {['Instagram', 'Behance', 'Press kit', 'Referidos'].map((source, idx) => (
                      <div key={source} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{source}</p>
                          <p className="text-xs text-muted-foreground">+{28 - idx * 3}% vs semana pasada</p>
                        </div>
                        <Badge variant="outline">{(45 - idx * 6).toString()}%</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Suscripciones newsletter</CardTitle>
                    <CardDescription>Últimos 6 envíos</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-2 flex-none rounded-full bg-gradient-to-b from-cyan-400 to-blue-600" />
                        <div className="flex w-full items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              Release #{idx + 12}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {22 - idx} dic · 1.2k aperturas
                            </p>
                          </div>
                          <Badge variant="success">+{8 + idx}%</Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="workflow">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Workflow editorial</CardTitle>
                    <CardDescription>Qué falta para la próxima release</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {workflow.map((step) => (
                      <div key={step.title} className="rounded-2xl bg-white p-4 shadow-inner">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{step.title}</p>
                            <p className="text-xs text-muted-foreground">{step.description}</p>
                          </div>
                          <Badge variant="muted">{step.owner}</Badge>
                        </div>
                        <Progress value={step.progress} className="mt-3" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Timeline de publicaciones</CardTitle>
                    <CardDescription>Agenda y responsables</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {['Lunes', 'Miércoles', 'Viernes'].map((day, index) => (
                      <div key={day} className="flex items-start gap-3">
                        <div className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                          {day}
                        </div>
                        <div className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                          <p className="text-sm font-semibold text-slate-800">
                            {index === 0
                              ? 'Nueva hero image + copy'
                              : index === 1
                                ? 'Grid experimental (video loop)'
                                : 'Landing Exhibitions 2025'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Responsable:{' '}
                            {index === 2 ? 'Equipo Gallery' : index === 1 ? 'Studio Motion' : 'Laura + Copy Lab'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
