"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const question_controller_1 = require("../controllers/question.controller");
const router = express_1.default.Router();
router.post('/questions', async (req, res) => {
    try {
        console.log('Received question data:', req.body);
        const questions = await (0, question_controller_1.saveQuestion)(req.body);
        console.log('Questions saved:', questions);
        return res.status(201).json(questions);
    }
    catch (error) {
        console.error('Route error:', error);
        if (error instanceof Error) {
            return res.status(500).json({
                error: 'Failed to save questions',
                details: error.message
            });
        }
        return res.status(500).json({ error: 'Failed to save questions' });
    }
});
router.get('/questions', async (req, res) => {
    try {
        const questions = await (0, question_controller_1.getQuestions)(req.query);
        res.json(questions);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get questions' });
    }
});
router.put('/questions/:id', async (req, res) => {
    try {
        const question = await (0, question_controller_1.updateQuestion)(req.params.id, req.body);
        res.json(question);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update question' });
    }
});
router.delete('/questions/:id', async (req, res) => {
    try {
        await (0, question_controller_1.deleteQuestion)(req.params.id);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete question' });
    }
});
exports.default = router;
//# sourceMappingURL=question.routes.js.map