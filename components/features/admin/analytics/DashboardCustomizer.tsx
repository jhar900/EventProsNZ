'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import {
  Settings,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Save,
  Share,
  Download,
  Upload,
  RefreshCw,
  Grid3X3,
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  MapPin,
  Target,
} from 'lucide-react';

interface Widget {
  id: string;
  type: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  enabled: boolean;
  position: number;
  size: 'small' | 'medium' | 'large';
  config: Record<string, any>;
}

interface DashboardLayout {
  id: string;
  name: string;
  description: string;
  widgets: Widget[];
  isDefault: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DashboardCustomizerProps {
  onLayoutChange: (layout: DashboardLayout) => void;
  onWidgetToggle: (widgetId: string, enabled: boolean) => void;
  onWidgetConfig: (widgetId: string, config: Record<string, any>) => void;
  currentLayout?: DashboardLayout;
  className?: string;
}

const AVAILABLE_WIDGETS: Omit<Widget, 'id' | 'position' | 'enabled'>[] = [
  {
    type: 'realtime-metrics',
    title: 'Real-Time Metrics',
    description: 'Live platform performance indicators',
    icon: TrendingUp,
    size: 'large',
    config: { refreshInterval: 30, showAlerts: true },
  },
  {
    type: 'user-growth',
    title: 'User Growth',
    description: 'User acquisition and retention analytics',
    icon: Users,
    size: 'medium',
    config: { showCohorts: true, showChurn: true },
  },
  {
    type: 'revenue-analytics',
    title: 'Revenue Analytics',
    description: 'Revenue tracking and subscription metrics',
    icon: DollarSign,
    size: 'medium',
    config: { showForecast: true, showBreakdown: true },
  },
  {
    type: 'contractor-performance',
    title: 'Contractor Performance',
    description: 'Contractor metrics and rankings',
    icon: Target,
    size: 'large',
    config: { showRankings: true, showTrends: true },
  },
  {
    type: 'event-analytics',
    title: 'Event Analytics',
    description: 'Event creation and completion tracking',
    icon: Calendar,
    size: 'medium',
    config: { showCategories: true, showSuccess: true },
  },
  {
    type: 'job-board',
    title: 'Job Board Analytics',
    description: 'Job posting and application metrics',
    icon: BarChart3,
    size: 'medium',
    config: { showConversions: true, showCategories: true },
  },
  {
    type: 'geographic',
    title: 'Geographic Analytics',
    description: 'User and contractor distribution',
    icon: MapPin,
    size: 'large',
    config: { showHeatmap: true, showRegions: true },
  },
  {
    type: 'category-trends',
    title: 'Service Categories',
    description: 'Service category popularity and trends',
    icon: PieChart,
    size: 'medium',
    config: { showForecasts: true, showInsights: true },
  },
];

const LAYOUT_TEMPLATES: Omit<
  DashboardLayout,
  'id' | 'createdAt' | 'updatedAt'
>[] = [
  {
    name: 'Executive Dashboard',
    description: 'High-level overview for executives',
    widgets: [
      { ...AVAILABLE_WIDGETS[0], id: '1', position: 0, enabled: true },
      { ...AVAILABLE_WIDGETS[2], id: '2', position: 1, enabled: true },
      { ...AVAILABLE_WIDGETS[1], id: '3', position: 2, enabled: true },
    ],
    isDefault: false,
    isPublic: false,
  },
  {
    name: 'Operations Dashboard',
    description: 'Detailed operational metrics',
    widgets: [
      { ...AVAILABLE_WIDGETS[3], id: '1', position: 0, enabled: true },
      { ...AVAILABLE_WIDGETS[4], id: '2', position: 1, enabled: true },
      { ...AVAILABLE_WIDGETS[5], id: '3', position: 2, enabled: true },
    ],
    isDefault: false,
    isPublic: false,
  },
  {
    name: 'Marketing Dashboard',
    description: 'Marketing and growth focused metrics',
    widgets: [
      { ...AVAILABLE_WIDGETS[1], id: '1', position: 0, enabled: true },
      { ...AVAILABLE_WIDGETS[6], id: '2', position: 1, enabled: true },
      { ...AVAILABLE_WIDGETS[7], id: '3', position: 2, enabled: true },
    ],
    isDefault: false,
    isPublic: false,
  },
];

export default function DashboardCustomizer({
  onLayoutChange,
  onWidgetToggle,
  onWidgetConfig,
  currentLayout,
  className,
}: DashboardCustomizerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [layout, setLayout] = useState<DashboardLayout | null>(
    currentLayout || null
  );
  const [savedLayouts, setSavedLayouts] = useState<DashboardLayout[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSavedLayouts();
  }, []);

  const loadSavedLayouts = async () => {
    try {
      const response = await fetch('/api/admin/analytics/dashboard/layouts');
      if (response.ok) {
        const layouts = await response.json();
        setSavedLayouts(layouts);
      }
    } catch (error) {
      console.error('Error loading saved layouts:', error);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !layout) return;

    const items = Array.from(layout.widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedLayout = {
      ...layout,
      widgets: items.map((widget, index) => ({
        ...widget,
        position: index,
      })),
    };

    setLayout(updatedLayout);
    onLayoutChange(updatedLayout);
  };

  const handleWidgetToggle = (widgetId: string, enabled: boolean) => {
    if (!layout) return;

    const updatedLayout = {
      ...layout,
      widgets: layout.widgets.map(widget =>
        widget.id === widgetId ? { ...widget, enabled } : widget
      ),
    };

    setLayout(updatedLayout);
    onLayoutChange(updatedLayout);
    onWidgetToggle(widgetId, enabled);
  };

  const handleWidgetConfig = (
    widgetId: string,
    config: Record<string, any>
  ) => {
    if (!layout) return;

    const updatedLayout = {
      ...layout,
      widgets: layout.widgets.map(widget =>
        widget.id === widgetId
          ? { ...widget, config: { ...widget.config, ...config } }
          : widget
      ),
    };

    setLayout(updatedLayout);
    onLayoutChange(updatedLayout);
    onWidgetConfig(widgetId, config);
  };

  const addWidget = (widgetType: string) => {
    if (!layout) return;

    const widgetTemplate = AVAILABLE_WIDGETS.find(w => w.type === widgetType);
    if (!widgetTemplate) return;

    const newWidget: Widget = {
      ...widgetTemplate,
      id: Date.now().toString(),
      position: layout.widgets.length,
      enabled: true,
    };

    const updatedLayout = {
      ...layout,
      widgets: [...layout.widgets, newWidget],
    };

    setLayout(updatedLayout);
    onLayoutChange(updatedLayout);
  };

  const removeWidget = (widgetId: string) => {
    if (!layout) return;

    const updatedLayout = {
      ...layout,
      widgets: layout.widgets.filter(widget => widget.id !== widgetId),
    };

    setLayout(updatedLayout);
    onLayoutChange(updatedLayout);
  };

  const saveLayout = async () => {
    if (!layout) return;

    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/analytics/dashboard/layouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(layout),
      });

      if (response.ok) {
        const savedLayout = await response.json();
        setSavedLayouts(prev => [savedLayout, ...prev]);
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error saving layout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTemplate = (template: (typeof LAYOUT_TEMPLATES)[0]) => {
    const newLayout: DashboardLayout = {
      ...template,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setLayout(newLayout);
    onLayoutChange(newLayout);
    setIsTemplateDialogOpen(false);
  };

  const getWidgetIcon = (type: string) => {
    const widget = AVAILABLE_WIDGETS.find(w => w.type === type);
    return widget?.icon || Grid3X3;
  };

  const getSizeClass = (size: string) => {
    switch (size) {
      case 'small':
        return 'col-span-1';
      case 'medium':
        return 'col-span-2';
      case 'large':
        return 'col-span-3';
      default:
        return 'col-span-2';
    }
  };

  return (
    <div className={className}>
      {/* Customize Button */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Customize Dashboard
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customize Dashboard</DialogTitle>
            <DialogDescription>
              Drag and drop widgets to reorder, toggle visibility, and configure
              your dashboard
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Available Widgets */}
            <div>
              <h3 className="text-lg font-medium mb-3">Available Widgets</h3>
              <div className="grid gap-2 md:grid-cols-2">
                {AVAILABLE_WIDGETS.map(widget => {
                  const Icon = widget.icon;
                  return (
                    <div
                      key={widget.type}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-muted"
                      onClick={() => addWidget(widget.type)}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{widget.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {widget.description}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current Layout */}
            {layout && (
              <div>
                <h3 className="text-lg font-medium mb-3">Dashboard Layout</h3>
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="dashboard">
                    {provided => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="grid gap-4 md:grid-cols-3"
                      >
                        {layout.widgets.map((widget, index) => {
                          const Icon = getWidgetIcon(widget.type);
                          return (
                            <Draggable
                              key={widget.id}
                              draggableId={widget.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`p-4 border rounded-lg ${
                                    snapshot.isDragging ? 'shadow-lg' : ''
                                  } ${getSizeClass(widget.size)}`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                      <Icon className="h-4 w-4" />
                                      <span className="font-medium">
                                        {widget.title}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Button
                                        onClick={() =>
                                          handleWidgetToggle(
                                            widget.id,
                                            !widget.enabled
                                          )
                                        }
                                        size="sm"
                                        variant="outline"
                                      >
                                        {widget.enabled ? (
                                          <Eye className="h-4 w-4" />
                                        ) : (
                                          <EyeOff className="h-4 w-4" />
                                        )}
                                      </Button>
                                      <Button
                                        onClick={() => removeWidget(widget.id)}
                                        size="sm"
                                        variant="outline"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {widget.description}
                                  </div>
                                  <div className="mt-2">
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {widget.size}
                                    </Badge>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
            )}

            {/* Templates */}
            <div>
              <h3 className="text-lg font-medium mb-3">Layout Templates</h3>
              <div className="grid gap-4 md:grid-cols-3">
                {LAYOUT_TEMPLATES.map((template, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg cursor-pointer hover:bg-muted"
                    onClick={() => loadTemplate(template)}
                  >
                    <div className="font-medium">{template.name}</div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {template.description}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {template.widgets.length} widgets
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setIsTemplateDialogOpen(true)}
              variant="outline"
            >
              Load Template
            </Button>
            <Button onClick={saveLayout} disabled={isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Layout
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Selection Dialog */}
      <Dialog
        open={isTemplateDialogOpen}
        onOpenChange={setIsTemplateDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Load Template</DialogTitle>
            <DialogDescription>
              Choose a pre-built dashboard template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {LAYOUT_TEMPLATES.map((template, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg cursor-pointer hover:bg-muted"
                onClick={() => loadTemplate(template)}
              >
                <div className="font-medium">{template.name}</div>
                <div className="text-sm text-muted-foreground">
                  {template.description}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {template.widgets.length} widgets included
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
