const BONUS_RECHARGE_COST = 10;

const bonusState = {
  remove: { freeRechargeAvailable: true },
  swap: { freeRechargeAvailable: true }
};

function getRuntime() {
  return window.c3_runtimeInterface && window.c3_runtimeInterface._localRuntime;
}

function getBonusInstance(runtime, name) {
  const objectClass = runtime.GetObjectClassByName(name);
  if (!objectClass) {
    return null;
  }

  const instances = objectClass.GetInstances();
  return instances.length ? instances[0] : null;
}

function getCrystalTextInstance(runtime) {
  const objectClass = runtime.GetObjectClassByName("crystalt");
  if (!objectClass) {
    return null;
  }

  const instances = objectClass.GetInstances();
  if (!instances.length) {
    return null;
  }

  return instances[0].GetSdkInstance();
}

function parseCrystalAmount(text) {
  const match = String(text || "").match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function setCrystalAmount(textInstance, amount) {
  const safeAmount = Math.max(0, Math.floor(amount));
  textInstance._SetText(`${safeAmount}[icon=0]`);
}

function tryRechargeBonus(runtime, bonusName) {
  const bonus = getBonusInstance(runtime, bonusName);
  if (!bonus) {
    return;
  }

  const worldInfo = bonus.GetWorldInfo();
  if (worldInfo.GetOpacity() >= 1) {
    return;
  }

  const state = bonusState[bonusName];
  if (!state) {
    return;
  }

  if (state.freeRechargeAvailable) {
    state.freeRechargeAvailable = false;
    worldInfo.SetOpacity(1);
    return;
  }

  const crystalText = getCrystalTextInstance(runtime);
  if (!crystalText) {
    return;
  }

  const crystals = parseCrystalAmount(crystalText._text);
  if (crystals < BONUS_RECHARGE_COST) {
    return;
  }

  setCrystalAmount(crystalText, crystals - BONUS_RECHARGE_COST);
  worldInfo.SetOpacity(1);
}

function tryTapRecharge(runtime, clientX, clientY) {
  const canvas = runtime.GetCanvasManager().GetWebGLCanvas();
  if (!canvas) {
    return;
  }

  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    return;
  }

  const x = (clientX - rect.left) * runtime.GetOriginalViewportWidth() / rect.width;
  const y = (clientY - rect.top) * runtime.GetOriginalViewportHeight() / rect.height;

  for (const bonusName of Object.keys(bonusState)) {
    const bonus = getBonusInstance(runtime, bonusName);
    if (!bonus) {
      continue;
    }

    const wi = bonus.GetWorldInfo();
    const halfW = wi.GetWidth() * 0.5;
    const halfH = wi.GetHeight() * 0.5;

    if (Math.abs(x - wi.GetX()) <= halfW && Math.abs(y - wi.GetY()) <= halfH) {
      tryRechargeBonus(runtime, bonusName);
      break;
    }
  }
}

window.addEventListener("pointerdown", (event) => {
  const runtime = getRuntime();
  if (!runtime) {
    return;
  }

  tryTapRecharge(runtime, event.clientX, event.clientY);
}, { passive: true });
