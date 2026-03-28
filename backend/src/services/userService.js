import * as userRepository from '../repositories/userRepository.js';
import AppError from '../errors/AppError.js';

export const getUserById = async (id) => {
  const user = await userRepository.findById(id);
  
  if (!user) {
    throw new AppError("Không tìm thấy user", 400);
  }
  console.log(`info: in userService.js:6 id: ${user.id}, role: ${user.role}, fullName: ${user.full_name}`)

  return {id: user.id, role: user.role, fullName: user.full_name, email: user.email} || null;
}
