import 'package:hive_flutter/hive_flutter.dart';

class StorageService {
  static const String _boxName = 'p2d_cache';
  late Box _box;

  Future<void> init() async {
    await Hive.initFlutter();
    _box = await Hive.openBox(_boxName);
  }

  Future<void> write<T>(String key, T value) async {
    await _box.put(key, value);
  }

  T? read<T>(String key) {
    return _box.get(key) as T?;
  }

  Future<void> delete(String key) async {
    await _box.delete(key);
  }

  Future<void> clear() async {
    await _box.clear();
  }
}
