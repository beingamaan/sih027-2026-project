from ..models import Task

def predict_duration(task: Task, conservative: bool = False) -> dict:
    p50 = task.p50_duration_minutes or task.estimated_duration_minutes or 60
    p90 = task.p90_duration_minutes or int(p50 * 1.5)
    
    predicted_duration = p90 if conservative else p50
    overrun_prob = task.overrun_probability or 0.1

    return {
        "predicted_duration": predicted_duration,
        "p50": p50,
        "p90": p90,
        "overrun_probability": overrun_prob,
        "explanation": "Prototype estimate based on historical distribution."
    }
