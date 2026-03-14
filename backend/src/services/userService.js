import * as userRepository from '../repositories/userRepository.js';

export const getUserById = async (id) => {
  const user = userRepository.findById(id);

  return {id: user.id, username: user.username, role: user.role, fullName: user.full_name} || null;
}
