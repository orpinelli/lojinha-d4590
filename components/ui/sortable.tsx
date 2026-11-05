"use client"

import * as React from "react"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type Modifier,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Slot } from "@radix-ui/react-slot"
import { GripVertical } from "lucide-react"

import { cn } from "@/lib/utils"

const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 })

function announcements(ids: string[], getLabel: (id: string) => string): Announcements {
  const position = (id: string | number) => ids.indexOf(String(id)) + 1
  const name = (id: string | number) => getLabel(String(id)) || "Item"
  return {
    onDragStart: ({ active }) =>
      `${name(active.id)} selecionado, posição ${position(active.id)} de ${ids.length}.`,
    onDragOver: ({ active, over }) =>
      over
        ? `${name(active.id)} sobre a posição ${position(over.id)} de ${ids.length}.`
        : `${name(active.id)} fora da lista.`,
    onDragEnd: ({ active, over }) =>
      over
        ? `${name(active.id)} solto na posição ${position(over.id)} de ${ids.length}.`
        : `${name(active.id)} solto fora da lista.`,
    onDragCancel: ({ active }) => `Movimento cancelado. ${name(active.id)} voltou ao lugar.`,
  }
}

/**
 * Drag-and-drop ordering (mouse, touch and keyboard). Controlled: receives
 * the ids in the current order and reports the new order.
 */
function Sortable({
  ids,
  onReorder,
  layout = "list",
  getLabel = () => "",
  children,
}: {
  ids: string[]
  onReorder: (ids: string[]) => void
  layout?: "list" | "grid"
  getLabel?: (id: string) => string
  children: React.ReactNode
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = ids.indexOf(String(active.id))
    const to = ids.indexOf(String(over.id))
    if (from >= 0 && to >= 0) onReorder(arrayMove(ids, from, to))
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={layout === "list" ? [restrictToVerticalAxis] : undefined}
      onDragEnd={handleDragEnd}
      accessibility={{
        announcements: announcements(ids, getLabel),
        screenReaderInstructions: {
          draggable:
            "Para mover, pressione espaço ou Enter, use as setas e pressione espaço ou Enter para soltar. Esc cancela.",
        },
      }}
    >
      <SortableContext
        items={ids}
        strategy={layout === "list" ? verticalListSortingStrategy : rectSortingStrategy}
      >
        {children}
      </SortableContext>
    </DndContext>
  )
}

type SortableItemContextValue = Pick<
  ReturnType<typeof useSortable>,
  "attributes" | "listeners" | "setActivatorNodeRef" | "isDragging"
>

const SortableItemContext = React.createContext<SortableItemContextValue | null>(null)

/** Use `asChild` to make an existing element (e.g. a list row) sortable. */
function SortableItem({
  id,
  asChild = false,
  className,
  style,
  ...props
}: React.ComponentProps<"div"> & { id: string; asChild?: boolean }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id })
  const Comp = asChild ? Slot : "div"

  return (
    <SortableItemContext.Provider value={{ attributes, listeners, setActivatorNodeRef, isDragging }}>
      <Comp
        ref={setNodeRef}
        data-dragging={isDragging || undefined}
        style={{ ...style, transform: CSS.Translate.toString(transform), transition }}
        className={cn(
          "relative",
          isDragging && "z-20 bg-background shadow-xl ring-2 ring-primary/40",
          className
        )}
        {...props}
      />
    </SortableItemContext.Provider>
  )
}

/** Drag handle; `touch-none` keeps page scrolling working everywhere else. */
function SortableHandle({ label, className }: { label: string; className?: string }) {
  const context = React.useContext(SortableItemContext)
  if (!context) throw new Error("SortableHandle deve ficar dentro de <SortableItem>")
  const { attributes, listeners, setActivatorNodeRef, isDragging } = context

  return (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label={label}
      title="Arraste para mudar a ordem"
      className={cn(
        "flex size-10 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none",
        isDragging && "cursor-grabbing text-primary",
        className
      )}
    >
      <GripVertical className="size-5" />
    </button>
  )
}

export { Sortable, SortableHandle, SortableItem }
