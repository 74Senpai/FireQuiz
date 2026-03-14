import * as userRepository from '../repositories/userRepository.js';

export const getUserById = async (id) => {
  const user = await userRepository.findById(id);

  if (!user) return null;

  return { id: user.id, username: user.username, role: user.role, fullName: user.full_name };
};
