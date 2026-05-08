package com.hiepnt.vietlott.data.dao;

import android.database.Cursor;
import android.os.CancellationSignal;
import androidx.annotation.NonNull;
import androidx.room.CoroutinesRoom;
import androidx.room.EntityInsertionAdapter;
import androidx.room.RoomDatabase;
import androidx.room.RoomSQLiteQuery;
import androidx.room.SharedSQLiteStatement;
import androidx.room.util.CursorUtil;
import androidx.room.util.DBUtil;
import androidx.sqlite.db.SupportSQLiteStatement;
import com.hiepnt.vietlott.data.entity.DrawResult;
import java.lang.Class;
import java.lang.Exception;
import java.lang.Integer;
import java.lang.Object;
import java.lang.Override;
import java.lang.String;
import java.lang.SuppressWarnings;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.Callable;
import javax.annotation.processing.Generated;
import kotlin.Unit;
import kotlin.coroutines.Continuation;
import kotlinx.coroutines.flow.Flow;

@Generated("androidx.room.RoomProcessor")
@SuppressWarnings({"unchecked", "deprecation"})
public final class DrawResultDao_Impl implements DrawResultDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<DrawResult> __insertionAdapterOfDrawResult;

  private final SharedSQLiteStatement __preparedStmtOfDeleteByType;

  public DrawResultDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfDrawResult = new EntityInsertionAdapter<DrawResult>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `draw_results` (`id`,`type`,`date`,`numbers`,`specialNumber`) VALUES (nullif(?, 0),?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final DrawResult entity) {
        statement.bindLong(1, entity.getId());
        statement.bindString(2, entity.getType());
        statement.bindString(3, entity.getDate());
        statement.bindString(4, entity.getNumbers());
        if (entity.getSpecialNumber() == null) {
          statement.bindNull(5);
        } else {
          statement.bindLong(5, entity.getSpecialNumber());
        }
      }
    };
    this.__preparedStmtOfDeleteByType = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM draw_results WHERE type = ?";
        return _query;
      }
    };
  }

  @Override
  public Object insertAll(final List<DrawResult> results,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfDrawResult.insert(results);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object deleteByType(final String type, final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        final SupportSQLiteStatement _stmt = __preparedStmtOfDeleteByType.acquire();
        int _argIndex = 1;
        _stmt.bindString(_argIndex, type);
        try {
          __db.beginTransaction();
          try {
            _stmt.executeUpdateDelete();
            __db.setTransactionSuccessful();
            return Unit.INSTANCE;
          } finally {
            __db.endTransaction();
          }
        } finally {
          __preparedStmtOfDeleteByType.release(_stmt);
        }
      }
    }, $completion);
  }

  @Override
  public Flow<List<DrawResult>> getByType(final String type) {
    final String _sql = "SELECT * FROM draw_results WHERE type = ? ORDER BY date DESC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindString(_argIndex, type);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"draw_results"}, new Callable<List<DrawResult>>() {
      @Override
      @NonNull
      public List<DrawResult> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfType = CursorUtil.getColumnIndexOrThrow(_cursor, "type");
          final int _cursorIndexOfDate = CursorUtil.getColumnIndexOrThrow(_cursor, "date");
          final int _cursorIndexOfNumbers = CursorUtil.getColumnIndexOrThrow(_cursor, "numbers");
          final int _cursorIndexOfSpecialNumber = CursorUtil.getColumnIndexOrThrow(_cursor, "specialNumber");
          final List<DrawResult> _result = new ArrayList<DrawResult>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final DrawResult _item;
            final long _tmpId;
            _tmpId = _cursor.getLong(_cursorIndexOfId);
            final String _tmpType;
            _tmpType = _cursor.getString(_cursorIndexOfType);
            final String _tmpDate;
            _tmpDate = _cursor.getString(_cursorIndexOfDate);
            final String _tmpNumbers;
            _tmpNumbers = _cursor.getString(_cursorIndexOfNumbers);
            final Integer _tmpSpecialNumber;
            if (_cursor.isNull(_cursorIndexOfSpecialNumber)) {
              _tmpSpecialNumber = null;
            } else {
              _tmpSpecialNumber = _cursor.getInt(_cursorIndexOfSpecialNumber);
            }
            _item = new DrawResult(_tmpId,_tmpType,_tmpDate,_tmpNumbers,_tmpSpecialNumber);
            _result.add(_item);
          }
          return _result;
        } finally {
          _cursor.close();
        }
      }

      @Override
      protected void finalize() {
        _statement.release();
      }
    });
  }

  @Override
  public Object getAllByType(final String type,
      final Continuation<? super List<DrawResult>> $completion) {
    final String _sql = "SELECT * FROM draw_results WHERE type = ? ORDER BY date DESC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindString(_argIndex, type);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<List<DrawResult>>() {
      @Override
      @NonNull
      public List<DrawResult> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfType = CursorUtil.getColumnIndexOrThrow(_cursor, "type");
          final int _cursorIndexOfDate = CursorUtil.getColumnIndexOrThrow(_cursor, "date");
          final int _cursorIndexOfNumbers = CursorUtil.getColumnIndexOrThrow(_cursor, "numbers");
          final int _cursorIndexOfSpecialNumber = CursorUtil.getColumnIndexOrThrow(_cursor, "specialNumber");
          final List<DrawResult> _result = new ArrayList<DrawResult>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final DrawResult _item;
            final long _tmpId;
            _tmpId = _cursor.getLong(_cursorIndexOfId);
            final String _tmpType;
            _tmpType = _cursor.getString(_cursorIndexOfType);
            final String _tmpDate;
            _tmpDate = _cursor.getString(_cursorIndexOfDate);
            final String _tmpNumbers;
            _tmpNumbers = _cursor.getString(_cursorIndexOfNumbers);
            final Integer _tmpSpecialNumber;
            if (_cursor.isNull(_cursorIndexOfSpecialNumber)) {
              _tmpSpecialNumber = null;
            } else {
              _tmpSpecialNumber = _cursor.getInt(_cursorIndexOfSpecialNumber);
            }
            _item = new DrawResult(_tmpId,_tmpType,_tmpDate,_tmpNumbers,_tmpSpecialNumber);
            _result.add(_item);
          }
          return _result;
        } finally {
          _cursor.close();
          _statement.release();
        }
      }
    }, $completion);
  }

  @Override
  public Object getRecent(final String type, final int limit,
      final Continuation<? super List<DrawResult>> $completion) {
    final String _sql = "SELECT * FROM draw_results WHERE type = ? ORDER BY date DESC LIMIT ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 2);
    int _argIndex = 1;
    _statement.bindString(_argIndex, type);
    _argIndex = 2;
    _statement.bindLong(_argIndex, limit);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<List<DrawResult>>() {
      @Override
      @NonNull
      public List<DrawResult> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfType = CursorUtil.getColumnIndexOrThrow(_cursor, "type");
          final int _cursorIndexOfDate = CursorUtil.getColumnIndexOrThrow(_cursor, "date");
          final int _cursorIndexOfNumbers = CursorUtil.getColumnIndexOrThrow(_cursor, "numbers");
          final int _cursorIndexOfSpecialNumber = CursorUtil.getColumnIndexOrThrow(_cursor, "specialNumber");
          final List<DrawResult> _result = new ArrayList<DrawResult>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final DrawResult _item;
            final long _tmpId;
            _tmpId = _cursor.getLong(_cursorIndexOfId);
            final String _tmpType;
            _tmpType = _cursor.getString(_cursorIndexOfType);
            final String _tmpDate;
            _tmpDate = _cursor.getString(_cursorIndexOfDate);
            final String _tmpNumbers;
            _tmpNumbers = _cursor.getString(_cursorIndexOfNumbers);
            final Integer _tmpSpecialNumber;
            if (_cursor.isNull(_cursorIndexOfSpecialNumber)) {
              _tmpSpecialNumber = null;
            } else {
              _tmpSpecialNumber = _cursor.getInt(_cursorIndexOfSpecialNumber);
            }
            _item = new DrawResult(_tmpId,_tmpType,_tmpDate,_tmpNumbers,_tmpSpecialNumber);
            _result.add(_item);
          }
          return _result;
        } finally {
          _cursor.close();
          _statement.release();
        }
      }
    }, $completion);
  }

  @Override
  public Object getCount(final String type, final Continuation<? super Integer> $completion) {
    final String _sql = "SELECT COUNT(*) FROM draw_results WHERE type = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindString(_argIndex, type);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<Integer>() {
      @Override
      @NonNull
      public Integer call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final Integer _result;
          if (_cursor.moveToFirst()) {
            final int _tmp;
            _tmp = _cursor.getInt(0);
            _result = _tmp;
          } else {
            _result = 0;
          }
          return _result;
        } finally {
          _cursor.close();
          _statement.release();
        }
      }
    }, $completion);
  }

  @NonNull
  public static List<Class<?>> getRequiredConverters() {
    return Collections.emptyList();
  }
}
