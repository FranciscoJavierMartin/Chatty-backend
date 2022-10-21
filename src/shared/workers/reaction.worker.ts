import { DoneCallback, Job } from 'bull';
import Logger from 'bunyan';
import { config } from '@root/config';
import { reactionService } from '@service/db/reaction.service';

const log: Logger = config.createLogger('reactionWorker');

class ReactionWorker {
  public async addReactionToDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      await reactionService.addReactionDataToDB(job.data);
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }

  public async removeReactionFromDB(
    job: Job,
    done: DoneCallback
  ): Promise<void> {
    try {
      await reactionService.removeReactionDataFromDB(job.data);
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }
}

export const reactionWorker: ReactionWorker = new ReactionWorker();
