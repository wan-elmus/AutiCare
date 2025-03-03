# @router.post("/auth/login")
# async def login(
#     user_data: LoginRequest,
#     db: AsyncSession = Depends(get_db)
# ):
#     result = await db.execute(select(User).where(User.email == user_data.email))
#     user = result.scalar_one_or_none()
#     if not user or not pwd_context.verify(user_data.password, user.hashed_password):
#         raise HTTPException(status_code=401, detail="Invalid credentials")
    
#     expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
#     token_data = {"sub": user.email, "exp": expire}
#     token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
    
#     response = JSONResponse(content={"message": "Login successful"})
#     response.set_cookie(
#         key="token",
#         value=token,
#         max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
#         httponly=True,
#         secure=False,  # False for local dev; True in production
#         samesite="Lax",
#         path="/",
#     )
#     return response