import axios from 'axios';

class LangSmithService {
  constructor() {}

  get enabled() {
    return process.env.LANGSMITH_TRACING === 'true';
  }

  get projectName() {
    return process.env.LANGSMITH_PROJECT || 'default';
  }

  get apiKey() {
    return process.env.LANGSMITH_API_KEY;
  }

  get endpoint() {
    return process.env.LANGSMITH_ENDPOINT || 'https://api.smith.langchain.com';
  }

  /**
   * Create a trace run on LangSmith via REST API
   */
  async createRun(runData) {
    if (!this.enabled) {
      console.log('LangSmith tracing is disabled');
      return null;
    }

    const apiKey = this.apiKey;
    if (!apiKey) {
      console.error('LangSmith API key is missing');
      return null;
    }

    console.log('Creating LangSmith run:', runData.name);
    console.log('Project name:', this.projectName);

    try {
      const url = `${this.endpoint}/runs`;
      const payload = {
        id: runData.id,
        name: runData.name,
        run_type: runData.run_type || 'chain',
        inputs: runData.inputs || {},
        start_time: runData.start_time || new Date().toISOString(),
        session_name: this.projectName
      };

      await axios.post(url, payload, {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });

      console.log('LangSmith run created successfully via REST API:', runData.id);
      return { success: true, run_id: runData.id };
    } catch (error) {
      const errDetail = error.response ? JSON.stringify(error.response.data) : error.message;
      console.error('Failed to create LangSmith run via REST API:', errDetail);
      return null;
    }
  }

  /**
   * Update an existing trace run on LangSmith via REST API
   */
  async updateRun(runId, updateData) {
    if (!this.enabled) return null;

    const apiKey = this.apiKey;
    if (!apiKey) {
      console.error('LangSmith API key is missing');
      return null;
    }

    console.log('Updating LangSmith run:', runId);

    try {
      const url = `${this.endpoint}/runs/${runId}`;
      const payload = {
        outputs: updateData.outputs || {},
        end_time: updateData.end_time || new Date().toISOString(),
        status: updateData.status || 'success',
        error: updateData.error || null
      };

      await axios.patch(url, payload, {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });

      console.log('LangSmith run updated successfully via REST API:', runId);
      return { success: true };
    } catch (error) {
      const errDetail = error.response ? JSON.stringify(error.response.data) : error.message;
      console.error('Failed to update LangSmith run via REST API:', errDetail);
      return null;
    }
  }

  /**
   * Express middleware to capture API calls and trace them to LangSmith
   */
  createTraceMiddleware() {
    return async (req, res, next) => {
      if (!this.enabled) {
        return next();
      }

      const startTime = Date.now();
      // Generate a UUID-like 32-character hex ID (LangSmith accepts this format as a valid run ID)
      const runId = Array.from({length: 32}, () => Math.floor(Math.random() * 16).toString(16)).join('');

      // Create initial run asynchronously to not block client requests
      this.createRun({
        id: runId,
        name: `${req.method} ${req.path}`,
        run_type: 'chain',
        inputs: {
          method: req.method,
          path: req.path,
          query: req.query,
          body: req.body ? JSON.stringify(req.body).substring(0, 1000) : null,
        },
        start_time: new Date().toISOString(),
      }).catch(err => {
        console.error('Asynchronous LangSmith createRun error:', err.message);
      });

      req.langsmithRunId = runId;

      // Intercept res.json to capture output response
      const originalJson = res.json;
      res.json = function(data) {
        res.locals.responseData = data;
        return originalJson.call(this, data);
      };

      // Update run status upon request finish
      res.on('finish', () => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        this.updateRun(runId, {
          outputs: {
            status: res.statusCode,
            response: res.locals.responseData ? JSON.stringify(res.locals.responseData).substring(0, 1000) : null,
          },
          end_time: new Date().toISOString(),
          status: res.statusCode < 400 ? 'success' : 'error',
          execution_metadata: {
            duration_ms: duration,
          },
        }).catch(err => {
          console.error('Asynchronous LangSmith updateRun error:', err.message);
        });
      });

      next();
    };
  }
}

export default new LangSmithService();
