from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from prediction_engine import prediction_engine

router = APIRouter(prefix="/api/predictions", tags=["predictions"])


@router.get("/overcrowding")
def get_overcrowding_predictions(db: Session = Depends(get_db)):
    return prediction_engine.predict_overcrowding(db)


@router.get("/demand")
def get_demand_forecast(
    route_id: int | None = Query(None),
    db: Session = Depends(get_db),
):
    forecasts = prediction_engine.forecast_stop_demand(db)
    if route_id is not None:
        forecasts = [f for f in forecasts if f["route_id"] == route_id]
    return forecasts


@router.get("/heatmap")
def get_route_heatmap(db: Session = Depends(get_db)):
    return prediction_engine.route_heatmap(db)


@router.get("/trends")
def get_demand_trends(
    route_id: int | None = Query(None),
    db: Session = Depends(get_db),
):
    trends = prediction_engine.demand_trends(db)
    if route_id is not None:
        trends = [t for t in trends if t["route_id"] == route_id]
    return trends


@router.get("/festival-impact/{festival_id}")
def get_festival_impact(festival_id: int, db: Session = Depends(get_db)):
    return prediction_engine.festival_impact(db, festival_id)


@router.get("/festival-comparison")
def get_festival_comparison(db: Session = Depends(get_db)):
    return prediction_engine.normal_vs_festival_comparison(db)


@router.get("/model-metrics")
def get_model_metrics():
    """Returns Machine Learning model training metadata, evaluation metrics, and feature importances."""
    return prediction_engine.get_model_metrics()
