import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class LangSmithService {
  constructor() {
    // Don't read env vars in constructor - they might not be loaded yet
  }

  get enabled() {
    return process.env.LANGSMITH_TRACING === 'true';
  }

  get projectName() {
    return process.env.LANGSMITH_PROJECT || 'default';
  }

  async callPythonScript(action, data, runId = null) {
    const command = {
      action,
      data,
      run_id: runId
    };

    try {
      // Write command to file
      const fs = await import('fs');
      const commandPath = process.cwd() + '/../langsmith_command.json';
      fs.writeFileSync(commandPath, JSON.stringify(command));

      // Use absolute path to script in parent directory
      const scriptPath = process.cwd().replace(/\\/g, '/') + '/../langsmith_tracer.py';
      // Use virtual environment Python if it exists
      const venvPython = process.cwd().replace(/\\/g, '/') + '/../chroma_venv/Scripts/python.exe';
      const pythonCmd = `"${venvPython}" "${scriptPath}"`;
      
      // Read env vars directly to ensure they're loaded
      const apiKey = process.env.LANGSMITH_API_KEY;
      const endpoint = process.env.LANGSMITH_ENDPOINT || 'https://api.smith.langchain.com';
      const projectName = process.env.LANGSMITH_PROJECT || 'default';
      
      console.log('Passing to Python script:', { apiKey: apiKey ? '***' + apiKey.slice(-4) : 'missing', endpoint, projectName });
      
      const { stdout, stderr } = await execAsync(
        pythonCmd,
        {
          cwd: process.cwd().replace(/\\/g, '/').replace('/backend', ''),
          env: {
            ...process.env,
            LANGSMITH_TRACING: 'true',
            LANGSMITH_API_KEY: apiKey,
            LANGSMITH_ENDPOINT: endpoint,
            LANGSMITH_PROJECT: projectName
          }
        }
      );
      
      if (stderr) {
        console.error('Python script stderr:', stderr);
      }
      
      console.log('Python script stdout:', stdout);
      return JSON.parse(stdout);
    } catch (error) {
      console.error('Failed to call Python script:', error.message);
      return { error: error.message };
    }
  }

  async createRun(runData) {
    if (!this.enabled) {
      console.log('LangSmith tracing is disabled');
      return null;
    }

    console.log('Creating LangSmith run:', runData.name);
    console.log('Project name:', this.projectName);

    const result = await this.callPythonScript('create_run', runData);
    
    if (result.error) {
      console.error('Failed to create LangSmith run:', result.error);
      return null;
    }
    
    console.log('LangSmith run created successfully:', result.run_id);
    return result;
  }

  async updateRun(runId, updateData) {
    if (!this.enabled) return null;

    console.log('Updating LangSmith run:', runId);
    console.log('Update data:', JSON.stringify(updateData, null, 2));

    const result = await this.callPythonScript('update_run', updateData, runId);
    
    if (result.error) {
      console.error('Failed to update LangSmith run:', result.error);
      return null;
    }
    
    console.log('LangSmith run updated successfully');
    return result;
  }

  createTraceMiddleware() {
    return async (req, res, next) => {
      console.log('LangSmith middleware called for:', req.method, req.path);
      console.log('LangSmith enabled:', this.enabled);
      
      if (!this.enabled) {
        console.log('LangSmith tracing is disabled, skipping');
        return next();
      }

      const startTime = Date.now();
      // Generate a UUID-like ID (32 hex chars)
      const runId = Array.from({length: 32}, () => Math.floor(Math.random() * 16).toString(16)).join('');

      // Create initial run
      const result = await this.createRun({
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
      });

      // Store the returned run ID for later updates (use the one from Python script)
      req.langsmithRunId = result ? result.run_id : runId;

      // Intercept res.json to capture response
      const originalJson = res.json;
      res.json = function(data) {
        res.locals.responseData = data;
        return originalJson.call(this, data);
      };

      // Update run on response
      res.on('finish', async () => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        await this.updateRun(runId, {
          outputs: {
            status: res.statusCode,
            response: res.locals.responseData ? JSON.stringify(res.locals.responseData).substring(0, 1000) : null,
          },
          end_time: new Date().toISOString(),
          status: res.statusCode < 400 ? 'success' : 'error',
          execution_metadata: {
            duration_ms: duration,
          },
        });
      });

      next();
    };
  }
}

export default new LangSmithService();
