# 📸 Simple API Documentation - Pictures

Base URL: `http://localhost:8000`

## 🏠 Property Pictures

### 1. Upload Property Picture

```
POST /pictures/properties/{propertyId}
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
- file: <image-file>
- isMain: true/false (optional)
```

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "id": 15,
    "file_path": "properties/property_1_1703123456_abc123.jpg",
    "public_url": "https://xxx.supabase.co/storage/v1/object/public/property-pictures/properties/property_1_1703123456_abc123.jpg",
    "is_main": true,
    "created_at": "2023-12-21T10:30:00.000Z"
  }
}
```

**Error Response (403):**

```json
{
  "success": false,
  "message": "Properti tidak ditemukan atau Anda tidak memiliki akses"
}
```

---

### 2. Get Property Pictures

```
GET /pictures/properties/{propertyId}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 15,
      "property_id": 1,
      "file_path": "properties/property_1_1703123456_abc123.jpg",
      "is_main": true,
      "created_at": "2023-12-21T10:30:00.000Z",
      "public_url": "https://xxx.supabase.co/storage/v1/object/public/property-pictures/properties/property_1_1703123456_abc123.jpg"
    }
  ]
}
```

---

### 3. Delete Property Picture

```
DELETE /pictures/property/{pictureId}
Authorization: Bearer <token>
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Foto berhasil dihapus"
  }
}
```

---

## 🛏️ Room Pictures

### 4. Upload Room Picture

```
POST /pictures/rooms/{roomId}
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
- file: <image-file>
```

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "id": 8,
    "file_path": "rooms/room_1_1703123456_xyz789.jpg",
    "public_url": "https://xxx.supabase.co/storage/v1/object/public/room-pictures/rooms/room_1_1703123456_xyz789.jpg",
    "created_at": "2023-12-21T10:30:00.000Z"
  }
}
```

---

### 5. Get Room Pictures

```
GET /pictures/rooms/{roomId}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 8,
      "room_id": 1,
      "file_path": "rooms/room_1_1703123456_xyz789.jpg",
      "created_at": "2023-12-21T10:30:00.000Z",
      "public_url": "https://xxx.supabase.co/storage/v1/object/public/room-pictures/rooms/room_1_1703123456_xyz789.jpg"
    }
  ]
}
```

---

### 6. Delete Room Picture

```
DELETE /pictures/room/{pictureId}
Authorization: Bearer <token>
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Foto berhasil dihapus"
  }
}
```

---

## 📋 List All Pictures

### 9. Get All Property Pictures

```
GET /pictures/all-property-pictures
GET /pictures/all-property-pictures?property_id=123
Authorization: Bearer <token>
```

**Optional Query Parameter:**

- `property_id`: Filter foto berdasarkan properti tertentu

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 15,
      "property_id": 1,
      "file_path": "properties/property_1_1703123456_abc123.jpg",
      "is_main": true,
      "created_at": "2023-12-21T10:30:00.000Z",
      "public_url": "https://xxx.supabase.co/storage/v1/object/public/property-pictures/properties/property_1_1703123456_abc123.jpg",
      "property": {
        "id": 1,
        "name": "Villa Bali Paradise",
        "location": "Ubud, Bali"
      }
    },
    {
      "id": 16,
      "property_id": 2,
      "file_path": "properties/property_2_1703123999_xyz789.jpg",
      "is_main": false,
      "created_at": "2023-12-21T11:00:00.000Z",
      "public_url": "https://xxx.supabase.co/storage/v1/object/public/property-pictures/properties/property_2_1703123999_xyz789.jpg",
      "property": {
        "id": 2,
        "name": "Apartment Jakarta Center",
        "location": "Jakarta Pusat"
      }
    }
  ]
}
```

---

### 10. Get All Room Pictures

```
GET /pictures/all-room-pictures
Authorization: Bearer <token>
```

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 8,
      "room_id": 1,
      "file_path": "rooms/room_1_1703123456_xyz789.jpg",
      "created_at": "2023-12-21T10:30:00.000Z",
      "public_url": "https://xxx.supabase.co/storage/v1/object/public/room-pictures/rooms/room_1_1703123456_xyz789.jpg",
      "room": {
        "id": 1,
        "name": "Deluxe Room",
        "max_guests": 2
      },
      "property": {
        "id": 1,
        "name": "Villa Bali Paradise",
        "location": "Ubud, Bali"
      }
    },
    {
      "id": 9,
      "room_id": 3,
      "file_path": "rooms/room_3_1703124000_abc123.jpg",
      "created_at": "2023-12-21T11:15:00.000Z",
      "public_url": "https://xxx.supabase.co/storage/v1/object/public/room-pictures/rooms/room_3_1703124000_abc123.jpg",
      "room": {
        "id": 3,
        "name": "Family Suite",
        "max_guests": 4
      },
      "property": {
        "id": 2,
        "name": "Apartment Jakarta Center",
        "location": "Jakarta Pusat"
      }
    }
  ]
}
```

---

## 🔧 Helper Endpoints

### 11. Get Properties List

```
GET /pictures/properties/list
Authorization: Bearer <token>
```

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Villa Bali Paradise",
      "location": "Ubud, Bali"
    },
    {
      "id": 2,
      "name": "Apartment Jakarta Center",
      "location": "Jakarta Pusat"
    }
  ]
}
```

---

### 12. Get Rooms List

```
GET /pictures/properties/{propertyId}/rooms/list
Authorization: Bearer <token>
```

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Deluxe Room",
      "max_guests": 2
    },
    {
      "id": 2,
      "name": "Family Suite",
      "max_guests": 4
    }
  ]
}
```

---

## 📝 Quick Test Examples

### cURL Upload Property Picture:

```bash
curl -X POST \
  http://localhost:8000/pictures/properties/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@image.jpg" \
  -F "isMain=true"
```

### cURL Get Pictures:

```bash
curl http://localhost:8000/pictures/properties/1
```

### cURL Delete Picture:

```bash
curl -X DELETE \
  http://localhost:8000/pictures/property/15 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### cURL Get All Property Pictures:

```bash
# Semua foto properti
curl http://localhost:8000/pictures/all-property-pictures \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter berdasarkan property_id
curl "http://localhost:8000/pictures/all-property-pictures?property_id=123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### cURL Get All Room Pictures:

```bash
curl http://localhost:8000/pictures/all-room-pictures \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🚨 Common Errors

**400 - No File:**

```json
{
  "success": false,
  "message": "File harus diupload"
}
```

**401 - Unauthorized:**

```json
{
  "success": false,
  "message": "Token authorization diperlukan"
}
```

**413 - File Too Large:**

```json
{
  "success": false,
  "message": "File terlalu besar. Maksimal 5MB per file."
}
```

**400 - Invalid Property ID:**

```json
{
  "success": false,
  "message": "Property ID harus berupa angka"
}
```

---

## 👤 Profile Picture

### 13. Upload Profile Picture

```
POST /pictures/profile/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
- file: <image-file>
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Foto profil berhasil diupload",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john@example.com",
      "profile_picture": "https://xxx.supabase.co/storage/v1/object/public/avatars/avatars/avatar_550e8400_1703123456_abc123.jpg",
      "updated_at": "2023-12-21T10:30:00.000Z"
    },
    "file_path": "avatars/avatar_550e8400_1703123456_abc123.jpg",
    "public_url": "https://xxx.supabase.co/storage/v1/object/public/avatars/avatars/avatar_550e8400_1703123456_abc123.jpg"
  }
}
```

**Error Response (400):**

```json
{
  "success": false,
  "message": "File harus diupload"
}
```

---

### 14. Delete Profile Picture

```
DELETE /pictures/profile/delete
Authorization: Bearer <token>
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Foto profil berhasil dihapus",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john@example.com",
      "profile_picture": null,
      "updated_at": "2023-12-21T10:35:00.000Z"
    }
  }
}
```

**Error Response (400):**

```json
{
  "success": false,
  "message": "User tidak memiliki foto profil"
}
```

---

### cURL Examples for Profile Picture:

**Upload Profile Picture:**

```bash
curl -X POST http://localhost:8000/pictures/profile/upload \
  -H "Authorization: Bearer your-token-here" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@profile-photo.jpg"
```

**Delete Profile Picture:**

```bash
curl -X DELETE http://localhost:8000/pictures/profile/delete \
  -H "Authorization: Bearer your-token-here"
```
