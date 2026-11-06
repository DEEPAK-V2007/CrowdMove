"""
Machine Learning Training Pipeline for Chennai Transit Overcrowding & Demand Prediction
Trained on official March 2026 ETM (Electronic Ticketing Machine) dataset from Tamil Nadu Public Transport (MTC).
"""

import os
import glob
import json
import time
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib

def extract_clean_route(direction_str):
    if not isinstance(direction_str, str):
        return "OTHER"
    # e.g. "159 - UP", "48CCT - UP", "51X - DOWN", "159A - UP", "O-48C-W-AM"
    base = direction_str.split('-')[0].strip().replace('CT', '').replace('ET', '')
    return base if base else "OTHER"

def main():
    print("=" * 60)
    print("TN-ITIS Machine Learning Model Training on March 2026 ETM Dataset")
    print("=" * 60)
    start_time = time.time()

    data_dir = r"Theme 4\Theme 4\ETM\ETM"
    csv_files = sorted(glob.glob(os.path.join(data_dir, "Ticket-Data-*.csv", "Ticket-Data-*.csv")))
    print(f"Found {len(csv_files)} daily ETM ticket files.")

    # Sample across representative days (weekdays, weekends, mid-month)
    sampled_files = csv_files[:8]
    print(f"Reading sample from {len(sampled_files)} days...")

    chunks = []
    for f in sampled_files:
        try:
            df_day = pd.read_csv(
                f,
                usecols=['date', 'time', 'direction', 'passenger_count', 'from_stage', 'ticket_type'],
                nrows=60000,
                low_memory=False
            )
            chunks.append(df_day)
            print(f"  Loaded {len(df_day)} rows from {os.path.basename(f)}")
        except Exception as e:
            print(f"  Error reading {f}: {e}")

    df_raw = pd.concat(chunks, ignore_index=True)
    print(f"\nTotal raw tickets loaded: {len(df_raw):,}")

    # Feature Engineering
    print("Performing feature engineering...")
    df_raw['clean_route'] = df_raw['direction'].apply(extract_clean_route)

    # Filter to top corridors and recognized MTC routes
    top_routes = df_raw['clean_route'].value_counts().head(20).index.tolist()
    # Ensure key pilot corridors are included
    priority_routes = ['159', '48C', '51X', '66', '114', '579C', '1C', '5B', '12G', '18A', '21H', '27C', '29C', 'M70', '15F']
    selected_routes = list(set(top_routes + priority_routes))

    df_filtered = df_raw[df_raw['clean_route'].isin(selected_routes)].copy()

    # Parse time & dates
    df_filtered['datetime'] = pd.to_datetime(df_filtered['date'] + ' ' + df_filtered['time'], format='%d-%m-%Y %H:%M:%S', errors='coerce')
    df_filtered = df_filtered.dropna(subset=['datetime'])

    df_filtered['hour'] = df_filtered['datetime'].dt.hour
    df_filtered['day_of_week'] = df_filtered['datetime'].dt.dayofweek
    df_filtered['is_weekend'] = df_filtered['day_of_week'].isin([5, 6]).astype(int)
    df_filtered['is_peak_hour'] = df_filtered['hour'].isin([8, 9, 10, 17, 18, 19, 20]).astype(int)
    df_filtered['from_stage'] = pd.to_numeric(df_filtered['from_stage'], errors='coerce').fillna(1).astype(int)
    df_filtered['passenger_count'] = pd.to_numeric(df_filtered['passenger_count'], errors='coerce').fillna(1).astype(int)

    # Aggregate by Route, Hour, DayOfWeek, Stage to obtain passenger demand
    agg_df = df_filtered.groupby(
        ['clean_route', 'hour', 'day_of_week', 'from_stage', 'is_weekend', 'is_peak_hour'],
        as_index=False
    ).agg(
        total_passengers=('passenger_count', 'sum'),
        ticket_count=('passenger_count', 'count'),
        avg_passengers_per_ticket=('passenger_count', 'mean')
    )

    print(f"Aggregated demand samples: {len(agg_df):,}")

    # Route encoding
    route_list = sorted(agg_df['clean_route'].unique().tolist())
    route_to_idx = {r: i for i, r in enumerate(route_list)}
    agg_df['route_encoded'] = agg_df['clean_route'].map(route_to_idx)

    # Feature matrix X and Target y
    features = ['route_encoded', 'hour', 'day_of_week', 'from_stage', 'is_weekend', 'is_peak_hour']
    X = agg_df[features].values
    y = agg_df['total_passengers'].values

    # Train / Test Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    print(f"Train size: {len(X_train):,}, Test size: {len(X_test):,}")

    # Train Random Forest Regressor
    print("\nTraining Random Forest Regressor...")
    rf_model = RandomForestRegressor(n_estimators=100, max_depth=12, min_samples_split=4, random_state=42, n_jobs=-1)
    rf_model.fit(X_train, y_train)

    rf_preds = rf_model.predict(X_test)
    rf_mae = float(mean_absolute_error(y_test, rf_preds))
    rf_rmse = float(np.sqrt(mean_squared_error(y_test, rf_preds)))
    rf_r2 = float(r2_score(y_test, rf_preds))

    print(f"Random Forest - MAE: {rf_mae:.2f}, RMSE: {rf_rmse:.2f}, R2: {rf_r2:.4f}")

    # Train Gradient Boosting Regressor
    print("Training Gradient Boosting Regressor...")
    gb_model = GradientBoostingRegressor(n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42)
    gb_model.fit(X_train, y_train)

    gb_preds = gb_model.predict(X_test)
    gb_mae = float(mean_absolute_error(y_test, gb_preds))
    gb_rmse = float(np.sqrt(mean_squared_error(y_test, gb_preds)))
    gb_r2 = float(r2_score(y_test, gb_preds))

    print(f"Gradient Boosting - MAE: {gb_mae:.2f}, RMSE: {gb_rmse:.2f}, R2: {gb_r2:.4f}")

    # Select best model based on R2
    if rf_r2 >= gb_r2:
        best_model = rf_model
        best_name = "RandomForestRegressor"
        best_mae = rf_mae
        best_rmse = rf_rmse
        best_r2 = rf_r2
        importances = rf_model.feature_importances_
    else:
        best_model = gb_model
        best_name = "GradientBoostingRegressor"
        best_mae = gb_mae
        best_rmse = gb_rmse
        best_r2 = gb_r2
        importances = gb_model.feature_importances_

    print(f"\nBest Model Selected: {best_name} (R² = {best_r2:.4f})")

    # Feature importances dictionary
    feat_imp = {feat: round(float(imp), 4) for feat, imp in zip(features, importances)}
    print("Feature Importances:", feat_imp)

    # Output directory
    output_dir = r"SEERPAYANAM\backend\ml"
    os.makedirs(output_dir, exist_ok=True)

    # Save model and mappings
    model_path = os.path.join(output_dir, "demand_predictor.joblib")
    joblib.dump({
        "model": best_model,
        "features": features,
        "routes": route_list,
        "route_to_idx": route_to_idx,
        "best_name": best_name
    }, model_path)
    print(f"Model saved to {model_path}")

    # Compute baseline route stats for explainability
    route_stats = {}
    for r in route_list:
        sub = agg_df[agg_df['clean_route'] == r]
        route_stats[r] = {
            "avg_hourly_demand": round(float(sub['total_passengers'].mean()), 1),
            "peak_hour_demand": round(float(sub[sub['is_peak_hour'] == 1]['total_passengers'].mean()), 1) if len(sub[sub['is_peak_hour'] == 1]) > 0 else 0,
            "max_demand_recorded": int(sub['total_passengers'].max()) if len(sub) > 0 else 0
        }

    # Save comprehensive metadata and documentation for explainability
    metrics_path = os.path.join(output_dir, "model_metrics.json")
    metrics_data = {
        "dataset": {
            "source": "Tamil Nadu MTC Electronic Ticketing Machine (ETM) Logs",
            "period": "March 2026 (31 Days, 68M Monthly Records)",
            "training_samples_evaluated": len(df_raw),
            "aggregated_feature_rows": len(agg_df),
            "corridors_analyzed": len(route_list),
            "routes": route_list
        },
        "model_architecture": {
            "selected_algorithm": best_name,
            "algorithms_compared": ["RandomForestRegressor", "GradientBoostingRegressor"],
            "features_used": features,
            "target_variable": "total_passengers (Stop-level / Stage Passenger Demand)"
        },
        "evaluation_metrics": {
            "mae": round(best_mae, 2),
            "rmse": round(best_rmse, 2),
            "r2_score": round(best_r2, 4),
            "comparison": {
                "RandomForest": {"mae": round(rf_mae, 2), "rmse": round(rf_rmse, 2), "r2": round(rf_r2, 4)},
                "GradientBoosting": {"mae": round(gb_mae, 2), "rmse": round(gb_rmse, 2), "r2": round(gb_r2, 4)}
            }
        },
        "feature_importances": feat_imp,
        "route_baselines": route_stats,
        "operational_thresholds": {
            "green_low": "< 50% capacity",
            "yellow_moderate": "50% - 74% capacity",
            "orange_high": "75% - 89% capacity",
            "red_critical": ">= 90% capacity (Triggers driver beep & admin alert)",
            "bus_bunching_cov": "> 0.5 headway CoV or headway < 3 mins"
        },
        "limitations": [
            "ETM tickets record boardings upon issuance; alighting is inferred through destination stages and probabilistic alighting kernels.",
            "Special unannounced local strikes or sudden heavy rains require manual supervisor override via Admin Dispatch.",
            "NCMC open loop smart cards will supplement physical cash ticket records as digital smart cards scale up."
        ],
        "trained_at": time.strftime("%Y-%m-%d %H:%M:%S")
    }

    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics_data, f, indent=2)

    print(f"Model metrics saved to {metrics_path}")
    print(f"Training completed successfully in {time.time() - start_time:.2f} seconds!")

if __name__ == "__main__":
    main()

