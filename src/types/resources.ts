import { VideoEffect } from "@/media-editor/browser/components/tabs/effects/effects"
import { VideoFilter } from "@/media-editor/browser/components/tabs/filters/filters"
import { MediaTemplate } from "@/media-editor/browser/components/tabs/templates/templates"
import { MediaFile } from "@/types/media"
import { TransitionEffect } from "@/types/transitions"

// Общий интерфейс для всех ресурсов
export interface Resource {
  id: string
  type: ResourceType
  name: string
  resourceId: string // ID оригинального ресурса (эффекта, фильтра, перехода или шаблона)
  addedAt: number // Время добавления ресурса
}

// Типы ресурсов
export type ResourceType = "effect" | "filter" | "transition" | "template" | "music"

// Интерфейс для эффектов
export interface EffectResource extends Resource {
  type: "effect"
  effect: VideoEffect
  params?: Record<string, any> // Параметры эффекта
}

// Интерфейс для фильтров
export interface FilterResource extends Resource {
  type: "filter"
  filter: VideoFilter
  params?: Record<string, any> // Параметры фильтра
}

// Интерфейс для переходов
export interface TransitionResource extends Resource {
  type: "transition"
  transition: TransitionEffect
  params?: Record<string, any> // Параметры перехода
}

// Интерфейс для шаблонов
export interface TemplateResource extends Resource {
  type: "template"
  template: MediaTemplate
  params?: Record<string, any> // Параметры шаблона
}

// Интерфейс для музыкальных файлов
export interface MusicResource extends Resource {
  type: "music"
  file: MediaFile
  params?: Record<string, any> // Параметры музыкального файла
}

// Тип для всех ресурсов
export type TimelineResource =
  | EffectResource
  | FilterResource
  | TransitionResource
  | TemplateResource
  | MusicResource

// Функция для создания ресурса эффекта
export function createEffectResource(effect: VideoEffect): EffectResource {
  return {
    id: `effect-${effect.id}-${Date.now()}`,
    type: "effect",
    name: effect.name,
    resourceId: effect.id,
    addedAt: Date.now(),
    effect,
    params: effect.params ? { ...effect.params } : {},
  }
}

// Функция для создания ресурса фильтра
export function createFilterResource(filter: VideoFilter): FilterResource {
  return {
    id: `filter-${filter.id}-${Date.now()}`,
    type: "filter",
    name: filter.name,
    resourceId: filter.id,
    addedAt: Date.now(),
    filter,
    params: filter.params ? { ...filter.params } : {},
  }
}

// Функция для создания ресурса перехода
export function createTransitionResource(transition: TransitionEffect): TransitionResource {
  console.log("Creating transition resource from:", transition)
  const resource: TransitionResource = {
    id: `transition-${transition.id}-${Date.now()}`,
    type: "transition",
    name: transition.name || transition.id,
    resourceId: transition.id,
    addedAt: Date.now(),
    transition,
    params: transition.params ? { ...transition.params } : {},
  }
  console.log("Created transition resource:", resource)
  return resource
}

// Функция для создания ресурса шаблона
export function createTemplateResource(template: MediaTemplate): TemplateResource {
  return {
    id: `template-${template.id}-${Date.now()}`,
    type: "template",
    name: template.id,
    resourceId: template.id,
    addedAt: Date.now(),
    template,
    params: {},
  }
}

// Функция для создания ресурса музыкального файла
export function createMusicResource(file: MediaFile): MusicResource {
  return {
    id: `music-${file.id}-${Date.now()}`,
    type: "music",
    name: file.name,
    resourceId: file.id,
    addedAt: Date.now(),
    file,
    params: {},
  }
}
