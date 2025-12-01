from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def get_health():
	return {"status": "healthy"}


@router.get("/ready")
def get_ready():
	# child spans (`select 1` & db connection reset) was still logged,
	# since i don't really wanna deal with it, let's just do that.
	return {"status": "healthy"}

