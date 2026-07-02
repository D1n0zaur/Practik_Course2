from typing import List
from sqlalchemy.orm import Session
from app.models import Material
from app.schemas import LayerInput, LayerDetail, Totals, Thermal, Gas


# ID материала для арматуры (сталь стержневая арматурная)
ARMATURE_MATERIAL_ID = 160


def calculate_wall(
    db: Session,
    layers: List[LayerInput],
    armature_mass: float,
    area: float,
    gsop: float
) -> dict:
    """
    Выполняет расчёт стены по методике из ТЗ.
    Возвращает словарь, соответствующий WallCalculationResponse.
    """

    # Собираем все ID материалов (слои + арматура)
    material_ids = {layer.material_id for layer in layers}
    material_ids.add(ARMATURE_MATERIAL_ID)

    materials = db.query(Material).filter(Material.id.in_(material_ids)).all()
    material_map = {m.id: m for m in materials}

    missing = material_ids - set(material_map.keys())
    if missing:
        raise ValueError(f"Materials with IDs {missing} not found")

    layer_details: List[LayerDetail] = []
    total_mass = 0.0
    total_co2 = 0.0
    total_energy = 0.0
    r0 = 0.15841  # 1/αint + 1/αext

    # Обработка слоёв
    for layer in layers:
        mat = material_map[layer.material_id]
        density = mat.density or 0.0
        mass = density * layer.thickness
        co2 = mass * (mat.co2_factor or 0.0)
        energy = mass * (mat.energy_factor or 0.0)

        total_mass += mass
        total_co2 += co2
        total_energy += energy

        if mat.lambda_value and mat.lambda_value > 0:
            r0 += layer.thickness / mat.lambda_value

        layer_details.append(LayerDetail(
            material_name=mat.name,
            thickness_m=layer.thickness,
            mass_kg_per_m2=mass,
            co2_kgCO2_per_m2=co2,
            energy_MJ_per_m2=energy
        ))

    # Обработка арматуры
    armature_mat = material_map[ARMATURE_MATERIAL_ID]
    mass_arm = armature_mass
    co2_arm = mass_arm * (armature_mat.co2_factor or 0.0)
    energy_arm = mass_arm * (armature_mat.energy_factor or 0.0)

    total_mass += mass_arm
    total_co2 += co2_arm
    total_energy += energy_arm

    layer_details.append(LayerDetail(
        material_name=armature_mat.name,
        thickness_m=None,
        mass_kg_per_m2=mass_arm,
        co2_kgCO2_per_m2=co2_arm,
        energy_MJ_per_m2=energy_arm
    ))

    if r0 <= 0:
        raise ValueError("R0 must be positive")

    heat_loss_per_m2 = (0.024 * gsop) / r0
    heat_loss_total = heat_loss_per_m2 * area

    gas_per_m2 = heat_loss_per_m2 / (9.3 * 0.9)
    gas_total = gas_per_m2 * area

    return {
        "per_layer": layer_details,
        "totals": Totals(
            mass_total=total_mass,
            co2_total=total_co2,
            energy_total=total_energy
        ),
        "thermal": Thermal(
            r0=r0,
            q_per_m2=heat_loss_per_m2,
            q_total=heat_loss_total
        ),
        "gas": Gas(
            v_per_m2=gas_per_m2,
            v_total=gas_total
        ),
        "calculation_version": "1.0"
    }