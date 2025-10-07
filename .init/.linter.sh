#!/bin/bash
cd /home/kavia/workspace/code-generation/resume-match-optimizer-147493-147502/resume_matcher_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

