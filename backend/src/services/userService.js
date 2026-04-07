import * as userRepository from '../repositories/userRepository.js';
import logger from '../utils/logger.js';

export const getUserById = async (id) => {
  const user = await userRepository.findById(id);

  if (!user) {
    return null;
  }

  logger.info(
    `userService.js - id: ${user.id}, role: ${user.role}, fullName: ${user.full_name}`,
  );

  return {
    id: user.id,
    role: user.role,
    fullName: user.full_name,
    email: user.email,
  };
};
