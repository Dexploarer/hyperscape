 
/**
 * SystemBase - Base class for all systems
 * 
 * Eliminates boilerplate code and provides common functionality:
 * - Default lifecycle method implementations
 * - Proper resource cleanup tracking
 * - event handling patterns
 * - Type-safe system dependencies
 */

import { EventBus, EventSubscription, SystemEvent } from './EventBus';
import { System, SystemDependencies } from './System';
import type { AnyEvent } from '../types/events';
import type { World } from '../types/index';
import { SystemConfig } from '../types/core';
import { SystemLogger } from '../utils/Logger';
import type { EventMap } from '../types/event-system';
import { EventType } from '../types/events';

export abstract class SystemBase extends System {
  protected readonly systemName: string;
  protected readonly config: SystemConfig;
  protected readonly logger: SystemLogger;
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();
  private readonly intervals = new Set<ReturnType<typeof setInterval>>();
  private readonly eventSubscriptions = new Set<EventSubscription>();
  protected readonly eventBus: EventBus;

  constructor(world: World, config: SystemConfig) {
    super(world);
    this.systemName = config.name;
    this.config = config;
    this.logger = new SystemLogger(this.systemName);
    
    // Initialize event bus - systems require it
    const worldExt = world as World & { $eventBus: EventBus };
    worldExt.$eventBus = worldExt.$eventBus || new EventBus();
    this.eventBus = worldExt.$eventBus;
  }

  /**
   * Override this method to define system dependencies
   */
  getDependencies(): SystemDependencies {
    return this.config.dependencies || {};
  }

  /**
   * Protected helper to create managed timers that auto-cleanup
   */
  protected createTimer(callback: () => void, delay: number): ReturnType<typeof setTimeout> {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      callback();
    }, delay);
    this.timers.add(timer);
    return timer;
  }

  /**
   * Protected helper to create managed intervals that auto-cleanup
   */
  protected createInterval(callback: () => void, delay: number): NodeJS.Timeout {
    const interval = setInterval(callback, delay);
    this.intervals.add(interval);
    return interval;
  }

  /**
   * Protected helper to subscribe to events with auto-cleanup (strongly typed)
   */
  protected subscribe<K extends keyof EventMap>(
    eventType: K,
    handler: (data: EventMap[K]) => void | Promise<void>
  ): EventSubscription;
  protected subscribe<T = AnyEvent>(
    eventType: string,
    handler: (event: SystemEvent<T>) => void | Promise<void>
  ): EventSubscription;
  protected subscribe<K extends keyof EventMap, T = AnyEvent>(
    eventType: K | string,
    handler: ((data: EventMap[K]) => void | Promise<void>) | ((event: SystemEvent<T>) => void | Promise<void>)
  ): EventSubscription {
    // For strongly typed events, wrap the handler to extract data from SystemEvent
    if (eventType in EventType) {
      const typedHandler = handler as (data: EventMap[K]) => void | Promise<void>;
      const wrappedHandler = (event: SystemEvent<EventMap[K]>) => typedHandler(event.data);
      const subscription = this.eventBus.subscribe(eventType as string, wrappedHandler as (event: SystemEvent<AnyEvent>) => void | Promise<void>);
      this.eventSubscriptions.add(subscription);
      return subscription;
    } else {
      // Fallback to legacy behavior for non-typed events
      const subscription = this.eventBus.subscribe(eventType as string, handler as (event: SystemEvent<AnyEvent>) => void | Promise<void>);
      this.eventSubscriptions.add(subscription);
      return subscription;
    }
  }

  /**
   * Protected helper to subscribe to events once with auto-cleanup (strongly typed)
   */
  protected subscribeOnce<K extends keyof EventMap>(
    eventType: K,
    handler: (data: EventMap[K]) => void | Promise<void>
  ): EventSubscription;
  protected subscribeOnce<T = AnyEvent>(
    eventType: string,
    handler: (event: SystemEvent<T>) => void | Promise<void>
  ): EventSubscription;
  protected subscribeOnce<K extends keyof EventMap, T = AnyEvent>(
    eventType: K | string,
    handler: ((data: EventMap[K]) => void | Promise<void>) | ((event: SystemEvent<T>) => void | Promise<void>)
  ): EventSubscription {
    // For strongly typed events, wrap the handler to extract data from SystemEvent
    if (eventType in EventType) {
      const typedHandler = handler as (data: EventMap[K]) => void | Promise<void>;
      const wrappedHandler = (event: SystemEvent<EventMap[K]>) => typedHandler(event.data);
      const subscription = this.eventBus.subscribeOnce(eventType as string, wrappedHandler as (event: SystemEvent<AnyEvent>) => void | Promise<void>);
      this.eventSubscriptions.add(subscription);
      return subscription;
    } else {
      // Fallback to legacy behavior for non-typed events
      const subscription = this.eventBus.subscribeOnce(eventType as string, handler as (event: SystemEvent<AnyEvent>) => void | Promise<void>);
      this.eventSubscriptions.add(subscription);
      return subscription;
    }
  }

  /**
   * Protected helper to emit typed events
   */
  protected emitTypedEvent<K extends keyof EventMap>(eventType: K, data: EventMap[K]): void;
  protected emitTypedEvent(eventType: string, data: AnyEvent): void;
  protected emitTypedEvent<K extends keyof EventMap>(eventType: K | string, data: EventMap[K] | AnyEvent): void {
    this.eventBus.emitEvent(eventType as string, data as AnyEvent, this.systemName);
  }

  /**
   * Protected helper for request-response pattern
   */
  protected async request<TRequest extends AnyEvent = AnyEvent, TResponse extends AnyEvent = AnyEvent>(
    requestType: string,
    data: TRequest,
    timeout?: number
  ): Promise<TResponse> {
    return this.eventBus.request<TRequest, TResponse>(requestType, data, this.systemName, timeout);
  }

  /**
   * Protected helper to respond to requests
   */
  protected respond<T extends AnyEvent = AnyEvent>(
    originalEvent: SystemEvent<{ _responseType?: string; _requestId?: string }>,
    responseData: T
  ): void {
    this.eventBus.respond<T>(originalEvent, responseData, this.systemName);
  }



  /**
   * Override this for custom cleanup logic
   * Base implementation handles timers, intervals, and event listeners
   */
  destroy(): void {
    // Clear all managed timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();

    // Clear all managed intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();

    // Remove all event subscriptions
    this.eventSubscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
    this.eventSubscriptions.clear();

    // Call parent cleanup
    super.destroy();
  }

  // Default implementations - systems only override what they need
  preTick(): void {
    // Default: do nothing
  }

  preFixedUpdate(): void {
    // Default: do nothing
  }

  fixedUpdate(_dt: number): void {
    // Default: do nothing
  }

  postFixedUpdate(): void {
    // Default: do nothing
  }

  preUpdate(): void {
    // Default: do nothing
  }

  update(_dt: number): void {
    // Default: do nothing
  }

  postUpdate(): void {
    // Default: do nothing
  }

  lateUpdate(): void {
    // Default: do nothing
  }

  postLateUpdate(): void {
    // Default: do nothing
  }

  commit(): void {
    // Default: do nothing
  }

  postTick(): void {
    // Default: do nothing
  }
}