import { Observable } from '../../utils/Observable.js';
import TickWorker from '../../utils/TickWorker.js';
import AudioService from '../AudioService/AudioService.js';
import IntervalService from '../IntervalService/IntervalService.js';
import { PomodoroStates } from './Pomodoro.types.js';

/**
 * This class controls the pomodoro function of the app
 * This is designed to be consumed by components
 *
 * Mainly focusing on:
 * - Focus
 * - Break
 * - Timer
 * - Focus Timer
 */
class PomodoroService {
  private static instance: PomodoroService | null = null;
  private tickWorker: TickWorker;

  state = new Observable<PomodoroStates>('pre-focus');
  remainingTime = new Observable<number>(IntervalService.focusTime);
  focusTime = new Observable<number>(0);
  totalTime = new Observable<number>(0);

  // Flag if the timer is running
  isTimerRunning: boolean = false;

  private constructor() {
    if (PomodoroService.instance) {
      throw new Error(
        'Cannot create multiple instances of a Singleton. Use getInstance() instead.'
      );
    }

    this.tickWorker = new TickWorker();
    // Whenever the interval is changed, it should reset
    IntervalService.interval.subscribe(this.onReset.bind(this));
    this.listenToTicks();
    this.cleanup();
  }

  /**
   * Resets the pomodoro state to the initial state
   */
  public onReset(): void {
    this.isTimerRunning = false;
    this.remainingTime.setValue(IntervalService.focusTime);
    this.state.setValue('pre-focus');
    this.tickWorker.stop();
  }

  /**
   * Resets the focus timer back to 00:00
   */
  public onResetFocusTime(): void {
    this.focusTime.setValue(0);
  }

  /**
   * Resets the total time timer back to 00:00
   */
  public onResetTotalTime(): void {
    this.focusTime.setValue(0);
  }

  /**
   * Starts the "Focus" mode
   */
  public onFocus(): void {
    this.isTimerRunning = true;
    this.tickWorker.start();
    this.remainingTime.setValue(IntervalService.focusTime);
    this.state.setValue('focus');
  }

  /**
   * Starts the "Break" mode
   */
  public onBreak(): void {
    this.isTimerRunning = true;
    this.tickWorker.start();
    this.remainingTime.setValue(IntervalService.breakTime);
    this.state.setValue('break');
  }

  public static getInstance(): PomodoroService {
    if (!this.instance) {
      this.instance = new PomodoroService();
    }

    return this.instance;
  }

  /**
   * Listens to tick events from the worker and updates the timer.
   */
  private listenToTicks(): void {
    const worker = this.tickWorker.worker;

    // This happens when the browser doesn't support workers
    if (!worker) {
      return;
    }

    worker.addEventListener('message', (event) => {
      if (event.data === TickWorker.TICK_ID && this.isTimerRunning) {
        const remainingTime = this.remainingTime.getValue();
        this.remainingTime.setValue(remainingTime - 1);

        this.totalTime.setValue(this.totalTime.getValue() + 1);

        if (this.state.getValue() === 'focus') {
          this.focusTime.setValue(this.focusTime.getValue() + 1);
        }

        if (remainingTime <= 0) {
          this.onTimerFinished();
        }
      }
    });
  }

  /**
   * When the timer has finished (like it reached 00:00)
   */
  private onTimerFinished(): void {
    AudioService.playAlarm();

    if (this.state.getValue() === 'focus') {
      this.state.setValue('pre-break');
    } else if (this.state.getValue() === 'break') {
      this.state.setValue('pre-focus');
    }
  }

  /**
   * Cleanup before unloading the app
   */
  private cleanup(): void {
    window.addEventListener('beforeunload', () => {
      this.tickWorker.terminate();
      IntervalService.interval.unsubscribe(this.onReset.bind(this));
    });
  }
}

export default PomodoroService.getInstance();
