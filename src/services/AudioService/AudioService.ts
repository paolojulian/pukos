import { Observable } from '../../utils/Observable.js';

/**
 * This class controls audio related functions
 * e.g. When timer has finished, and play background music
 */
class AudioService {
  private static instance: AudioService | null = null;
  isPlayingAlarm = new Observable<boolean>(false);
  private alarmAudio: HTMLAudioElement | null;

  private constructor() {
    if (AudioService.instance) {
      throw new Error(
        'Cannot create multiple instances of a Singleton. Use getInstance() instead.'
      );
    }
    this.alarmAudio = document.getElementById(
      'pomodoroAlertAudio'
    ) as HTMLAudioElement | null;
  }

  public static getInstance(): AudioService {
    if (!this.instance) {
      this.instance = new AudioService();
    }

    return this.instance;
  }

  init() {
    if (this.alarmAudio) {
      this.alarmAudio.addEventListener('ended', this.onAlarmEnded.bind(this));
    }
  }

  /**
   * Handles when the alarm's audio time has ended
   */
  onAlarmEnded() {
    if (this.alarmAudio) {
      this.alarmAudio.currentTime = 0;
    }
    this.isPlayingAlarm.setValue(false);
  }

  /**
   * Handles playing the alarm,
   * This is usually called when the timer has finished for focus/break
   */
  playAlarm(): void {
    if (!this.alarmAudio) {
      return;
    }

    this.isPlayingAlarm.setValue(true);
    this.alarmAudio.currentTime = 0;
    this.alarmAudio.play();
  }

  /**
   * Handles stopping the alarm,
   * This is usually called when the alarm is still running and the user decides to do an action (e.g. focus)
   */
  stopAlarm(): void {
    if (!this.alarmAudio) {
      return;
    }

    this.isPlayingAlarm.setValue(false);
    this.alarmAudio.currentTime = 0;
    this.alarmAudio.pause();
  }
}

export default AudioService.getInstance();
